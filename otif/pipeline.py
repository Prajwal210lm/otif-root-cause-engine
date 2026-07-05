"""Deterministic orchestration nodes (no LLM).

prep_partition is the firewall in code: it routes each failed order to the
specialist(s) whose domain fired, handing over only agent-views.

rollup turns per-order driver attributions into cash-by-driver, counts, and
percentage shares. The attributor names the cause; this node counts the money
from the tested engine. No number in the brief originates in the model.
"""
from dataclasses import dataclass

from otif.constants import DRIVERS
from otif.engine import compute_signals, compute_financial_impact, _fired_domains
from otif.generator import agent_view


@dataclass(frozen=True)
class Partition:
    by_specialist: dict   # domain -> list[agent_view], orders where that domain fired
    assignments: dict     # order_id -> tuple of fired domains (sorted)


def prep_partition(batch) -> Partition:
    """Route each order to its fired specialists. Clean orders go to one
    specialist, ambiguous orders to two. Every routed item is a label-free
    agent-view."""
    by = {d: [] for d in DRIVERS}
    assignments = {}
    for lo in batch:
        sig = compute_signals(lo.order)
        fired = tuple(sorted(_fired_domains(sig)))
        view = agent_view(lo)
        for d in fired:
            by[d].append(view)
        assignments[lo.order.order_id] = fired
    return Partition(by_specialist=by, assignments=assignments)


@dataclass(frozen=True)
class DriverRollup:
    driver: str
    order_count: int
    cash: float
    cash_share: float    # fraction of total cash
    count_share: float   # fraction of total orders


@dataclass(frozen=True)
class Rollup:
    total_cash: float
    total_orders: int
    by_driver: tuple     # DriverRollup rows, ranked by cash desc then name


def rollup(batch, attributions: dict) -> Rollup:
    """Aggregate cash and counts by the attributed driver. Requires an
    attribution for every order; cash comes from the deterministic engine."""
    cash = {d: 0.0 for d in DRIVERS}
    count = {d: 0 for d in DRIVERS}
    total_cash = 0.0
    for lo in batch:
        oid = lo.order.order_id
        if oid not in attributions:
            raise ValueError(f"missing attribution for {oid}")
        drv = attributions[oid]
        if drv not in DRIVERS:
            raise ValueError(f"{oid}: attribution {drv!r} not a valid driver")
        impact = compute_financial_impact(lo.order, compute_signals(lo.order)).total
        cash[drv] += impact
        count[drv] += 1
        total_cash += impact
    total_orders = len(batch)
    rows = []
    for d in DRIVERS:
        cs = (cash[d] / total_cash) if total_cash else 0.0
        ks = (count[d] / total_orders) if total_orders else 0.0
        rows.append(DriverRollup(driver=d, order_count=count[d], cash=cash[d],
                                 cash_share=cs, count_share=ks))
    rows.sort(key=lambda r: (-r.cash, r.driver))
    return Rollup(total_cash=total_cash, total_orders=total_orders, by_driver=tuple(rows))
