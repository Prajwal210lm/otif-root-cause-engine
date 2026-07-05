"""Validate render gate (deterministic, no LLM). The cage the coordinator writes
into: it substitutes {{placeholders}} with the roll-up's real numbers and rejects
any narrative that smuggles a bare digit, references an unknown placeholder, or
sits on a roll-up that does not reconcile. Numbers (and ranked driver names)
enter the brief only through this gate, never from the model."""
import re
from dataclasses import dataclass
from typing import Optional

PLACEHOLDER_RE = re.compile(r"\{\{\s*(\w+)\s*\}\}")


@dataclass(frozen=True)
class RenderResult:
    ok: bool
    rendered: Optional[str]
    violations: tuple


def _fmt_cash(x: float) -> str:
    return f"AED {int(round(x)):,}"


def _fmt_pct(frac: float) -> str:
    return f"{frac * 100:.0f}%"


def build_substitution_map(rollup) -> dict:
    """Every legal placeholder key -> its rendered string, sourced from the
    roll-up. Driver-keyed values and rank-keyed values both come from here."""
    smap = {
        "total_cash": _fmt_cash(rollup.total_cash),
        "total_orders": str(rollup.total_orders),
    }
    for row in rollup.by_driver:
        d = row.driver
        smap[f"{d}_cash"] = _fmt_cash(row.cash)
        smap[f"{d}_cash_share"] = _fmt_pct(row.cash_share)
        smap[f"{d}_count"] = str(row.order_count)
        smap[f"{d}_count_share"] = _fmt_pct(row.count_share)
    for i, row in enumerate(rollup.by_driver, start=1):
        smap[f"rank{i}_driver"] = row.driver
        smap[f"rank{i}_cash"] = _fmt_cash(row.cash)
        smap[f"rank{i}_cash_share"] = _fmt_pct(row.cash_share)
    return smap


def _rollup_reconciles(rollup) -> bool:
    summed = sum(r.cash for r in rollup.by_driver)
    if abs(summed - rollup.total_cash) > 0.01:
        return False
    if rollup.total_cash > 0:
        share_sum = sum(r.cash_share for r in rollup.by_driver)
        if abs(share_sum - 1.0) > 1e-6:
            return False
    return True


def has_bare_digit(narrative: str) -> bool:
    """True if the narrative contains any digit outside a placeholder span."""
    return bool(re.search(r"\d", PLACEHOLDER_RE.sub("", narrative)))


def render_gate(narrative: str, rollup) -> RenderResult:
    """Substitute placeholders from the roll-up, or withhold the brief if the
    narrative contains a bare digit, an unknown placeholder, or the roll-up does
    not reconcile."""
    violations = []

    if not _rollup_reconciles(rollup):
        violations.append("rollup does not reconcile")

    if has_bare_digit(narrative):
        violations.append("bare digit in narrative")

    smap = build_substitution_map(rollup)
    keys = PLACEHOLDER_RE.findall(narrative)
    unknown = sorted({k for k in keys if k not in smap})
    if unknown:
        violations.append(f"unknown placeholders: {unknown}")

    if violations:
        return RenderResult(ok=False, rendered=None, violations=tuple(violations))

    rendered = PLACEHOLDER_RE.sub(lambda m: smap[m.group(1)], narrative)
    if "{{" in rendered or "}}" in rendered:
        return RenderResult(ok=False, rendered=None, violations=("residual placeholder",))
    return RenderResult(ok=True, rendered=rendered, violations=())
