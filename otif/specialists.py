"""Specialist contract: the deterministic prompt-builder (data out to a domain
specialist) and the parser (validate the structured report that comes back).
The schema between them is what the coordinator and the mock both depend on.

Prompts are built only from agent-views, so the planted label cannot leak in.
The domain models teach each specialist its counterfactual reasoning as a
principle to apply to the numbers, not as a looked-up answer."""
import json
import math
from dataclasses import dataclass

from otif.constants import DRIVERS

STANCES = ("binding", "contributing", "incidental")
CONFIDENCES = ("low", "medium", "high")
SPECIALIST_DOMAINS = DRIVERS

DOMAIN_MODEL = {
    "supplier": (
        "A late inbound PO only causes an OTIF failure if the units it carried would "
        "have closed the order's shortfall. Weigh po_qty against shortfall_units. If po_qty "
        "would have covered the gap and the order was otherwise on time, your link is likely "
        "binding. If the order was ALSO late for a non-supply reason, fixing supply alone may "
        "not save it, so you are contributing, not binding."
    ),
    "demand": (
        "An under-forecast only causes a failure if the demand it missed would have covered "
        "the shortfall. Weigh the forecast miss (actual_period_demand minus forecast_qty) against "
        "shortfall_units. A forecast miss at least as large as the shortfall points to demand as "
        "binding; a miss smaller than the shortfall means demand alone does not explain it."
    ),
    "warehouse": (
        "You own two distinct faults. First, picking: a short pick is only YOUR fault if the stock "
        "was physically there (stock_sufficient_at_pick is true); if stock was insufficient, the "
        "short is upstream, not yours. Second, dispatch: a dispatch_delay that alone pushed delivery "
        "past the promised date is your fault regardless of stock. Separate these before claiming."
    ),
    "logistics": (
        "You own only the leg from dispatch to delivery. A failure is yours only if the transit "
        "overage alone pushed delivery past the promised date. If the order was already short or "
        "already late at dispatch, that is not your link."
    ),
}

_SCHEMA_TEXT = (
    '{\n'
    '  "domain": "<your domain>",\n'
    '  "pattern": "<one sentence describing the batch-level pattern in your domain>",\n'
    '  "claims": [\n'
    '    {\n'
    '      "order_id": "<id>",\n'
    '      "stance": "binding|contributing|incidental",\n'
    '      "confidence": "low|medium|high",\n'
    '      "reasoning": "<one or two sentences citing specific signal values>",\n'
    '      "cited_signals": {"<signal_name>": <value>}\n'
    '    }\n'
    '  ]\n'
    '}'
)


def _system(domain: str) -> str:
    return (
        f"You are the {domain} specialist in a multi-agent OTIF root-cause investigation. "
        f"You see only orders where the {domain} link is implicated, and only their raw fields "
        f"and computed signals. You never see the answer.\n\n"
        f"DOMAIN MODEL: {DOMAIN_MODEL[domain]}\n\n"
        f"TASK: For each failed order, decide whether your link ({domain}) is the dominant cause. "
        f"Set stance to binding (dominant cause), contributing (played a part but may not dominate), "
        f"or incidental (your signal fired but it is not the real story).\n\n"
        f"CONSTRAINTS: Cite only signal values that appear in the data for that order; never invent "
        f"or recompute a number. Be calibrated: if another link looks like the real cause, say "
        f"contributing or incidental. Always claiming binding makes you useless to the coordinator.\n\n"
        f"OUTPUT: strict JSON only, no prose outside the JSON, matching:\n{_SCHEMA_TEXT}"
    )


def build_specialist_prompt(domain: str, agent_views: list) -> dict:
    """Build the exact {system, user} prompt for a specialist. Consumes only
    agent-views, so the planted label cannot appear in the output."""
    if domain not in SPECIALIST_DOMAINS:
        raise ValueError(f"unknown specialist domain: {domain!r}")
    user = (
        f"Investigate these {domain}-implicated failed orders. Return exactly one claim per "
        f"order_id, no more and no fewer.\n\n"
        f"DATA (raw order fields + computed signals, one object per order):\n"
        f"{json.dumps(agent_views, indent=2, sort_keys=True)}"
    )
    return {"system": _system(domain), "user": user}


@dataclass(frozen=True)
class SpecialistClaim:
    order_id: str
    domain: str
    stance: str
    confidence: str
    reasoning: str
    cited_signals: dict


@dataclass(frozen=True)
class SpecialistReport:
    domain: str
    pattern: str
    claims: tuple


def _cited_value_matches(actual, cited) -> bool:
    """Loose-typed equality for cited evidence: bools/strings exact, numbers
    within a tolerance that accepts honest rounding but not fabrication.

    rel_tol=0.02 (2%): a specialist citing a fractional signal like
    forecast_error_pct in readable form (e.g. "0.347" for the true
    0.346711259754738) is off by well under 0.1%, comfortably inside this
    window. A genuinely fabricated citation (a different number entirely, not
    a rounded one) is virtually always tens of percent off or a different
    order of magnitude, and still fails: e.g. citing po_qty=999 against an
    actual 65 (~93% off), or 0.15 against an actual 0.35 (~57% off)."""
    if isinstance(actual, bool) or isinstance(cited, bool):
        return actual is cited or actual == cited
    if isinstance(actual, (int, float)) and isinstance(cited, (int, float)):
        return math.isclose(float(actual), float(cited), rel_tol=0.02, abs_tol=1e-9)
    return actual == cited


def parse_specialist_report(raw: dict, domain: str, expected_order_ids,
                            evidence_by_id: dict | None = None) -> SpecialistReport:
    """Validate a specialist's raw output against the contract. Raises ValueError
    on any structural violation: wrong domain, missing/extra/duplicate orders,
    invalid stance or confidence, empty reasoning. When evidence_by_id is given
    (order_id -> the agent-view's real order+signal values), every cited signal
    is cross-checked against it: an agent cannot cite a key that does not exist
    or a value that does not match the data it was shown."""
    if not isinstance(raw, dict):
        raise ValueError("specialist output is not a JSON object")
    if raw.get("domain") != domain:
        raise ValueError(f"domain mismatch: expected {domain!r}, got {raw.get('domain')!r}")
    pattern = raw.get("pattern")
    if not isinstance(pattern, str) or not pattern.strip():
        raise ValueError("pattern must be a non-empty string")
    raw_claims = raw.get("claims")
    if not isinstance(raw_claims, list):
        raise ValueError("claims must be a list")

    expected = set(expected_order_ids)
    seen = []
    claims = []
    for c in raw_claims:
        if not isinstance(c, dict):
            raise ValueError("each claim must be a JSON object")
        oid = c.get("order_id")
        if oid not in expected:
            raise ValueError(f"claim for unassigned order_id {oid!r}")
        if oid in seen:
            raise ValueError(f"duplicate claim for order_id {oid!r}")
        seen.append(oid)
        stance = c.get("stance")
        if stance not in STANCES:
            raise ValueError(f"{oid}: invalid stance {stance!r}")
        conf = c.get("confidence")
        if conf not in CONFIDENCES:
            raise ValueError(f"{oid}: invalid confidence {conf!r}")
        reasoning = c.get("reasoning")
        if not isinstance(reasoning, str) or not reasoning.strip():
            raise ValueError(f"{oid}: reasoning must be a non-empty string")
        cited = c.get("cited_signals")
        if not isinstance(cited, dict):
            raise ValueError(f"{oid}: cited_signals must be an object")
        if evidence_by_id is not None:
            evidence = evidence_by_id.get(oid, {})
            for key, val in cited.items():
                if key not in evidence:
                    raise ValueError(f"{oid}: cited signal {key!r} does not exist in the order data")
                if not _cited_value_matches(evidence[key], val):
                    raise ValueError(
                        f"{oid}: cited {key}={val!r} but the actual value is {evidence[key]!r}"
                    )
        claims.append(SpecialistClaim(order_id=oid, domain=domain, stance=stance,
                                      confidence=conf, reasoning=reasoning, cited_signals=cited))

    missing = expected - set(seen)
    if missing:
        raise ValueError(f"missing claims for: {sorted(missing)}")
    return SpecialistReport(domain=domain, pattern=pattern, claims=tuple(claims))
