"""Orchestration: thread the specialist and coordinator nodes through the
deterministic spine. The LLM is injected as a callable (system, user) -> str, so
a mock and the real Anthropic client are interchangeable. run_specialists is a
sequential loop here; the genuine parallel fan-out is the LangGraph step, which
reuses run_one_specialist as the four concurrent node bodies."""
import json
import re
from collections import defaultdict
from dataclasses import dataclass

from otif.constants import DRIVERS
from otif.specialists import (
    build_specialist_prompt,
    parse_specialist_report,
    SpecialistReport,
    SPECIALIST_DOMAINS,
)
from otif.coordinator import (
    build_coordinator_prompt,
    parse_coordinator_output,
    reconcile_attributions,
)
from otif.pipeline import prep_partition, rollup
from otif.validate import render_gate, has_bare_digit, RenderResult
from otif.scoring import score_run


def extract_json(text: str) -> dict:
    """Parse a JSON object from model output, tolerating code fences and a
    sentence of preamble or postamble."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1 or end < start:
            raise ValueError("no JSON object found in model output")
        return json.loads(text[start:end + 1])


def run_one_specialist(domain: str, views: list, llm) -> SpecialistReport:
    """One specialist call. Empty domains return an empty report without spending
    a call. This is the unit the LangGraph fan-out will run four-at-once."""
    if not views:
        return SpecialistReport(domain=domain, pattern="(no orders in scope)", claims=())
    prompt = build_specialist_prompt(domain, views)
    raw = extract_json(llm(prompt["system"], prompt["user"]))
    expected_ids = {v["order"]["order_id"] for v in views}
    # the agent may only cite evidence it was actually shown
    evidence_by_id = {
        v["order"]["order_id"]: {**v["order"], **v["signals"]} for v in views
    }
    return parse_specialist_report(raw, domain, expected_ids, evidence_by_id=evidence_by_id)


def run_specialists(partition, llm) -> dict:
    """Fan-out logic: one report per domain. Sequential here; parallel in graph."""
    return {d: run_one_specialist(d, partition.by_specialist[d], llm) for d in SPECIALIST_DOMAINS}


def assemble_claims(reports: dict, partition) -> list:
    """Rebuild per-order evidence: each order's signals joined with the one or two
    specialist claims filed for it. This is what the coordinator adjudicates."""
    signals_by_id = {}
    for views in partition.by_specialist.values():
        for v in views:
            signals_by_id[v["order"]["order_id"]] = v["signals"]
    claims_by_id = defaultdict(list)
    for d in DRIVERS:  # DRIVERS order, not reports-dict order, so graph thread
        report = reports.get(d)  # completion order cannot reorder an order's claims
        if report is None:
            continue
        for c in report.claims:
            claims_by_id[c.order_id].append({
                "domain": c.domain, "stance": c.stance, "confidence": c.confidence,
                "reasoning": c.reasoning, "cited_signals": c.cited_signals,
            })
    blocks = []
    for oid in sorted(signals_by_id):
        blocks.append({"order_id": oid, "signals": signals_by_id[oid],
                       "claims": claims_by_id[oid]})
    return blocks


def run_coordinator(order_blocks: list, patterns: dict, batch_order_ids, llm,
                    max_retries: int = 2, extra_user_note: str = ""):
    """One coordinator call with two bounded retries: a single retry if the
    output cannot be parsed (malformed JSON / contract violation, the error is
    quoted back), and up to max_retries re-prompts if the narrative leaks a bare
    digit. Returns the last attempt even if still leaking, so the render gate
    stays the final authority."""
    prompt = build_coordinator_prompt(order_blocks, patterns)
    system, user = prompt["system"], prompt["user"] + extra_user_note
    parse_budget = 1
    out = None
    digit_attempts = 0
    while digit_attempts < max_retries + 1:
        text = llm(system, user)
        try:
            raw = extract_json(text)
            out = parse_coordinator_output(raw, batch_order_ids)
        except ValueError as e:
            if parse_budget > 0:
                parse_budget -= 1
                user = (
                    user + f"\n\nREJECTED: your previous output could not be parsed ({e}). "
                    "Re-output the full response as strict JSON only, exactly matching the "
                    "required schema, with no prose outside the JSON."
                )
                continue  # a parse retry does not consume a digit attempt
            raise
        if not has_bare_digit(out.narrative):
            return out
        user = (
            user + "\n\nREJECTED: your previous narrative contained a bare digit, which is "
            "forbidden. Every number must be a {{placeholder}} from the allowed list, and you "
            "must write no digit 0-9 anywhere in the narrative (spell any small count as a word). "
            "Re-output the full JSON now with a compliant narrative."
        )
        digit_attempts += 1
    return out


def run_coordinator_reconciled(order_blocks: list, patterns: dict, batch_order_ids,
                               assignments: dict, llm, max_retries: int = 2):
    """Coordinator call plus attribution enforcement: if any order is attributed
    to a team whose signal did not fire, re-prompt once quoting the violations.
    Returns (coord, violations); non-empty violations after the retry mean the
    caller must withhold the brief (render-gate philosophy)."""
    coord = run_coordinator(order_blocks, patterns, batch_order_ids, llm, max_retries=max_retries)
    violations = reconcile_attributions(coord.attributions, assignments)
    if violations:
        note = (
            "\n\nREJECTED: these attributions name a team whose signal did not fire for that "
            "order: " + "; ".join(violations) + ". Every order may only be attributed to a team "
            "that filed a claim for it. Re-output the full JSON with corrected attributions."
        )
        coord = run_coordinator(order_blocks, patterns, batch_order_ids, llm,
                                max_retries=max_retries, extra_user_note=note)
        violations = reconcile_attributions(coord.attributions, assignments)
    return coord, violations


def withheld_render(violations) -> RenderResult:
    """The brief is withheld when attributions are structurally invalid, same
    philosophy as the render gate: an unverifiable brief never renders."""
    return RenderResult(
        ok=False,
        rendered=None,
        violations=tuple(f"attribution violation: {v}" for v in violations),
    )


@dataclass(frozen=True)
class PipelineResult:
    attributions: dict
    rollup: object
    render: object
    scorecard: object
    naive: object
    lift: object
    attribution_violations: tuple
    reports: dict


def run_pipeline(batch, llm) -> PipelineResult:
    """Full chain: partition -> specialists -> assemble -> coordinator -> reconcile
    -> roll-up -> render gate -> scoring. Driven by whatever llm is injected."""
    partition = prep_partition(batch)
    reports = run_specialists(partition, llm)
    order_blocks = assemble_claims(reports, partition)
    patterns = {d: reports[d].pattern for d in reports}
    batch_ids = {lo.order.order_id for lo in batch}
    coord, violations = run_coordinator_reconciled(
        order_blocks, patterns, batch_ids, partition.assignments, llm
    )
    r = rollup(batch, coord.attributions)
    render = withheld_render(violations) if violations else render_gate(coord.narrative, r)
    card, naive, lift = score_run(batch, coord.attributions)
    return PipelineResult(
        attributions=coord.attributions, rollup=r, render=render, scorecard=card,
        naive=naive, lift=lift, attribution_violations=violations, reports=reports,
    )
