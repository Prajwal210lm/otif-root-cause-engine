"""Coordinator contract: the deterministic prompt-builder (competing specialist
claims in) and the parser/reconciler (validated attribution map + placeholder
narrative out). The coordinator adjudicates ambiguous orders by reasoning over
the claims; it is deliberately NOT given the oracle's precedence rules, so the
accuracy it earns is real. Numbers in its narrative are placeholders only."""
import json
from dataclasses import dataclass

from otif.constants import DRIVERS


def _placeholder_vocab() -> list:
    vocab = ["total_cash", "total_orders"]
    for d in DRIVERS:
        vocab += [f"{d}_cash", f"{d}_cash_share", f"{d}_count", f"{d}_count_share"]
    for i in range(1, len(DRIVERS) + 1):
        vocab += [f"rank{i}_driver", f"rank{i}_cash", f"rank{i}_cash_share"]
    return vocab


PLACEHOLDER_VOCAB = _placeholder_vocab()


@dataclass(frozen=True)
class CoordinatorOutput:
    attributions: dict   # order_id -> driver, every order exactly once
    narrative: str       # board brief with {{placeholders}}, no bare digits


def _coordinator_system() -> str:
    vocab = ", ".join(f"{{{{{k}}}}}" for k in PLACEHOLDER_VOCAB)
    return (
        "You are the coordinator in a multi-agent OTIF root-cause investigation. Four specialist "
        "agents (demand, supplier, warehouse, logistics) have each investigated the orders where "
        "their link was implicated and filed claims with a stance (binding, contributing, "
        "incidental), a confidence, and reasoning grounded in the order's signals.\n\n"
        "TASK: For every order, name the single dominant driver. For an order with one claim, that "
        "link is the cause. For an order with two competing claims, weigh the two specialists' "
        "stances, confidences, and reasoning against the order's signals and decide which link "
        "dominates. You must reason this out from the evidence; you are not given a rulebook for "
        "breaking ties. Attribute each order only to a link that filed a claim for it.\n\n"
        "Then write a short board brief for a COO: name the ranked drivers by cash impact, give one "
        "action per driver, and state what you could not establish.\n\n"
        "CONSTRAINTS: Every number and every ranked driver name in the brief must be written as a "
        "placeholder from the list below. Write NO bare digits and NO driver names in the ranked "
        "statements; the system fills them from audited figures. You may refer to a domain by name "
        "only in qualitative prose (e.g. 'supplier lateness clustered late in the month'). "
        "ABSOLUTE RULE: the narrative must not contain any digit 0-9 anywhere, not in prose, not in "
        "actions, not in counts or dates. Do not cite any individual order's signal values, dates, "
        "SLAs, or quantities. If a small count is unavoidable, spell it as a word ('three suppliers', "
        "not '3'). Any digit that is not inside a placeholder will cause the brief to be rejected.\n\n"
        f"ALLOWED PLACEHOLDERS: {vocab}\n\n"
        "OUTPUT: strict JSON only, no prose outside the JSON, matching:\n"
        '{\n'
        '  "attributions": {"<order_id>": "<demand|supplier|warehouse|logistics>", "...": "..."},\n'
        '  "narrative": "<board brief using only the allowed placeholders for numbers and ranks>"\n'
        '}'
    )


def build_coordinator_prompt(order_blocks: list, patterns: dict) -> dict:
    """Build the {system, user} coordinator prompt. order_blocks is a list of
    {order_id, signals, claims}; patterns maps domain -> its batch pattern."""
    user = (
        "Adjudicate every order below. Return an attribution for each order_id and a board brief.\n\n"
        "PER-ORDER EVIDENCE (signals + the specialist claims filed for that order):\n"
        f"{json.dumps(order_blocks, indent=2, sort_keys=True)}\n\n"
        "BATCH-LEVEL PATTERNS (one per specialist):\n"
        f"{json.dumps(patterns, indent=2, sort_keys=True)}"
    )
    return {"system": _coordinator_system(), "user": user}


def parse_coordinator_output(raw: dict, batch_order_ids) -> CoordinatorOutput:
    """Validate the coordinator's raw output. Raises ValueError on missing/extra
    orders, invalid drivers, or an empty narrative."""
    if not isinstance(raw, dict):
        raise ValueError("coordinator output is not a JSON object")
    attributions = raw.get("attributions")
    if not isinstance(attributions, dict):
        raise ValueError("attributions must be an object")
    expected = set(batch_order_ids)
    got = set(attributions.keys())
    if got != expected:
        missing = sorted(expected - got)
        extra = sorted(got - expected)
        raise ValueError(f"attribution coverage mismatch: missing={missing} extra={extra}")
    for oid, drv in attributions.items():
        if drv not in DRIVERS:
            raise ValueError(f"{oid}: invalid driver {drv!r}")
    narrative = raw.get("narrative")
    if not isinstance(narrative, str) or not narrative.strip():
        raise ValueError("narrative must be a non-empty string")
    return CoordinatorOutput(attributions=dict(attributions), narrative=narrative)


def reconcile_attributions(attributions: dict, assignments: dict) -> tuple:
    """The coordinator may only attribute an order to a link that actually fired.
    For a clean order this forces the single fired domain; for an ambiguous order
    it constrains the verdict to the fired pair. Returns violation strings."""
    violations = []
    for oid, fired in assignments.items():
        if oid not in attributions:
            violations.append(f"{oid}: no attribution")
            continue
        attr = attributions[oid]
        if attr not in fired:
            violations.append(f"{oid}: attributed to {attr!r}, not in fired {fired}")
    return tuple(violations)
