"""Synthetic OTIF failed-order generator (forward construction).

Each order is built by perturbing a hypothetically-perfect order along exactly
the lever(s) its archetype owns. Labels are NOT chosen; they are stamped by the
oracle from the engine's computed facts. The agent-facing view strips every
ground-truth field, so the specialists and coordinator never see the answer.
"""
import random
from dataclasses import dataclass, asdict

from otif.types import Order, Signals
from otif.engine import (
    compute_signals,
    compute_counterfactuals,
    oracle_attribution,
    _fired_domains,
)

DEFAULT_SEED = 42
DEFAULT_N = 140

# realistic DC-to-retail order economics
VALUE_RANGE = (50_000, 500_000)  # AED per order
CATS = {
    "ambient":       (8, 40),
    "chilled":       (20, 90),
    "personal_care": (25, 150),
}
LANES = [("Dubai-Metro", 1), ("Abu-Dhabi", 2), ("Northern-Emirates", 2), ("Al-Ain", 3)]
CHANNELS = ["modern_trade", "modern_trade", "modern_trade", "pharmacy"]  # ~70/30

EXPECTED_FIRED = {
    "clean_demand": frozenset({"demand"}),
    "clean_supplier": frozenset({"supplier"}),
    "clean_wh_pick": frozenset({"warehouse"}),
    "clean_wh_dispatch": frozenset({"warehouse"}),
    "clean_logistics": frozenset({"logistics"}),
    "amb_demand_supplier": frozenset({"demand", "supplier"}),
    "amb_supplier_warehouse": frozenset({"supplier", "warehouse"}),
    "amb_warehouse_logistics": frozenset({"warehouse", "logistics"}),
}
# scenario weights (the planted story; individual labels stay emergent)
WEIGHTS = {
    "clean_supplier": 0.22, "clean_wh_pick": 0.10, "clean_wh_dispatch": 0.10,
    "clean_demand": 0.16, "clean_logistics": 0.12,
    "amb_demand_supplier": 0.10, "amb_supplier_warehouse": 0.06,
    "amb_warehouse_logistics": 0.06,
}


@dataclass(frozen=True)
class LabeledOrder:
    order: Order
    planted_driver: str
    planted_is_ambiguous: bool
    fired: tuple  # for self-validation only; never shown to agents


def _base(rng, oid):
    cat = rng.choice(list(CATS))
    ulo, uhi = CATS[cat]
    unit = round(rng.uniform(ulo, uhi), 2)
    value = rng.uniform(*VALUE_RANGE)
    Q = max(1, round(value / unit))
    lane, sla = rng.choice(LANES)
    ch = rng.choice(CHANNELS)
    P = rng.randint(8, 26)
    return dict(
        order_id=oid, channel=ch, sku_id=f"SKU-{rng.randint(1, 400):03d}",
        sku_category=cat, order_qty=Q, unit_value=unit, promised_date=P,
        forecast_qty=Q, actual_period_demand=Q, po_qty=0,
        po_promised_receipt_date=P - 6, actual_goods_receipt_date=P - 6,
        on_hand_at_pick=Q, picked_qty=Q, pick_ready_date=P - sla,
        dispatch_date=P - sla, lane=lane, lane_sla_days=sla,
        delivered_date=P, delivered_qty=Q, redelivered=False,
        cancelled_shortfall=False,
    )


def _short(rng, Q):
    return max(1, int(Q * rng.uniform(0.15, 0.45)))


def _recovery(rng, d):
    if rng.random() < 0.5:
        d["redelivered"] = True
    else:
        d["cancelled_shortfall"] = True


def _clean_demand(rng, oid):
    d = _base(rng, oid); Q = d["order_qty"]; S = _short(rng, Q)
    F = int(Q * rng.uniform(1.0, 1.8)); err = rng.uniform(0.20, 0.55)
    delta = int(F * err)
    S = min(S, max(1, delta - 1))
    d["forecast_qty"] = F; d["actual_period_demand"] = F + delta
    d["on_hand_at_pick"] = Q - S; d["picked_qty"] = Q - S; d["delivered_qty"] = Q - S
    _recovery(rng, d); return d


def _clean_supplier(rng, oid):
    d = _base(rng, oid); Q = d["order_qty"]; S = _short(rng, Q)
    F = int(Q * rng.uniform(0.95, 1.1)); d["forecast_qty"] = F
    d["actual_period_demand"] = int(F * rng.uniform(0.95, 1.12))
    late = rng.randint(2, 12); d["actual_goods_receipt_date"] = d["po_promised_receipt_date"] + late
    d["po_qty"] = int(S * rng.uniform(1.1, 2.0))
    d["on_hand_at_pick"] = Q - S; d["picked_qty"] = Q - S; d["delivered_qty"] = Q - S
    _recovery(rng, d); return d


def _clean_wh_pick(rng, oid):
    d = _base(rng, oid); Q = d["order_qty"]; S = _short(rng, Q)
    d["on_hand_at_pick"] = Q + rng.randint(0, 500)
    d["picked_qty"] = Q - S; d["delivered_qty"] = Q - S
    _recovery(rng, d); return d


def _clean_wh_dispatch(rng, oid):
    d = _base(rng, oid); sla = d["lane_sla_days"]; P = d["promised_date"]
    k = rng.randint(0, 2); dd = rng.randint(k + 1, k + 4)
    d["pick_ready_date"] = P - sla - k; d["dispatch_date"] = P - sla - k + dd
    d["delivered_date"] = d["dispatch_date"] + sla
    return d


def _clean_logistics(rng, oid):
    d = _base(rng, oid); sla = d["lane_sla_days"]; P = d["promised_date"]
    k = rng.randint(0, 2); ov = rng.randint(k + 1, k + 3)
    d["pick_ready_date"] = P - sla - k; d["dispatch_date"] = P - sla - k
    d["delivered_date"] = d["dispatch_date"] + sla + ov
    return d


def _amb_demand_supplier(rng, oid):
    d = _base(rng, oid); Q = d["order_qty"]; S = _short(rng, Q)
    F = int(Q * rng.uniform(1.0, 1.6)); err = rng.uniform(0.18, 0.45)
    delta = int(F * err); d["forecast_qty"] = F; d["actual_period_demand"] = F + delta
    late = rng.randint(3, 12); d["actual_goods_receipt_date"] = d["po_promised_receipt_date"] + late
    d["po_qty"] = int(Q * rng.uniform(0.10, 0.50))
    d["on_hand_at_pick"] = Q - S; d["picked_qty"] = Q - S; d["delivered_qty"] = Q - S
    _recovery(rng, d); return d


def _amb_supplier_warehouse(rng, oid):
    d = _base(rng, oid); Q = d["order_qty"]; S = _short(rng, Q)
    sla = d["lane_sla_days"]; P = d["promised_date"]
    F = int(Q * rng.uniform(0.95, 1.1)); d["forecast_qty"] = F
    d["actual_period_demand"] = int(F * rng.uniform(0.95, 1.12))
    late = rng.randint(3, 12); d["actual_goods_receipt_date"] = d["po_promised_receipt_date"] + late
    d["po_qty"] = int(S * rng.uniform(0.6, 1.6))
    d["on_hand_at_pick"] = Q - S; d["picked_qty"] = Q - S; d["delivered_qty"] = Q - S
    k = rng.randint(0, 1); dd = rng.randint(k + 1, k + 3)
    d["pick_ready_date"] = P - sla - k; d["dispatch_date"] = P - sla - k + dd
    d["delivered_date"] = d["dispatch_date"] + sla
    _recovery(rng, d); return d


def _amb_warehouse_logistics(rng, oid):
    d = _base(rng, oid); sla = d["lane_sla_days"]; P = d["promised_date"]
    k = rng.randint(0, 3); dd = rng.randint(1, 4); ov = rng.randint(1, 4)
    while dd + ov <= k:
        dd += 1
    d["pick_ready_date"] = P - sla - k; d["dispatch_date"] = P - sla - k + dd
    d["delivered_date"] = d["dispatch_date"] + sla + ov
    return d


BUILDERS = {
    "clean_demand": _clean_demand, "clean_supplier": _clean_supplier,
    "clean_wh_pick": _clean_wh_pick, "clean_wh_dispatch": _clean_wh_dispatch,
    "clean_logistics": _clean_logistics, "amb_demand_supplier": _amb_demand_supplier,
    "amb_supplier_warehouse": _amb_supplier_warehouse,
    "amb_warehouse_logistics": _amb_warehouse_logistics,
}
_MAX_REDRAWS = 50


def _build_one(rng, archetype, oid):
    """Build one order of the given archetype; re-draw until the intended
    signals (and only those) fire, then stamp the oracle label."""
    expected = EXPECTED_FIRED[archetype]
    for _ in range(_MAX_REDRAWS):
        d = BUILDERS[archetype](rng, oid)
        order = Order(**d)
        sig = compute_signals(order)
        fired = frozenset(_fired_domains(sig))
        if fired == expected:
            cf = compute_counterfactuals(order, sig)
            driver = oracle_attribution(order, sig, cf)
            return LabeledOrder(
                order=order, planted_driver=driver,
                planted_is_ambiguous=(len(fired) == 2), fired=tuple(sorted(fired)),
            )
    raise RuntimeError(f"generator could not satisfy {archetype} fired-set in {_MAX_REDRAWS} draws")


def generate_batch(seed: int = DEFAULT_SEED, n: int = DEFAULT_N) -> list:
    """Generate a seeded, reproducible batch of labeled failed OTIF orders."""
    rng = random.Random(seed)
    names = list(WEIGHTS.keys())
    wts = [WEIGHTS[k] for k in names]
    batch = []
    for i in range(n):
        archetype = rng.choices(names, weights=wts, k=1)[0]
        batch.append(_build_one(rng, archetype, f"OTIF-{i:04d}"))
    return batch


def agent_view(labeled: LabeledOrder) -> dict:
    """The ONLY thing an agent may see: raw order fields + computed signals.
    Strips planted_driver / planted_is_ambiguous. This is the firewall."""
    order = labeled.order
    sig = compute_signals(order)
    return {"order": asdict(order), "signals": asdict(sig)}
