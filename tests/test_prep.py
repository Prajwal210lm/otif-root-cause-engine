"""prep_partition proven over six hand-verified engine fixtures with known fired
sets. Routing counts and the firewall are derivable by hand."""
import pytest

from otif.types import Order
from otif.generator import LabeledOrder
from otif.pipeline import prep_partition, Partition

_FX = [
    (dict(order_id="A", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=200, unit_value=50, promised_date=20, forecast_qty=200,
          actual_period_demand=205, po_qty=60, po_promised_receipt_date=10,
          actual_goods_receipt_date=16, on_hand_at_pick=150, picked_qty=150,
          pick_ready_date=17, dispatch_date=17, lane="L", lane_sla_days=2,
          delivered_date=19, delivered_qty=150, redelivered=True,
          cancelled_shortfall=False), "supplier", False),
    (dict(order_id="B", channel="pharmacy", sku_id="S", sku_category="chilled",
          order_qty=100, unit_value=80, promised_date=18, forecast_qty=100,
          actual_period_demand=98, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=130, picked_qty=85,
          pick_ready_date=15, dispatch_date=15, lane="L", lane_sla_days=2,
          delivered_date=17, delivered_qty=85, redelivered=True,
          cancelled_shortfall=False), "warehouse", False),
    (dict(order_id="C", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=60, unit_value=120, promised_date=22, forecast_qty=60,
          actual_period_demand=58, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=80, picked_qty=60,
          pick_ready_date=20, dispatch_date=20, lane="L", lane_sla_days=2,
          delivered_date=24, delivered_qty=60, redelivered=False,
          cancelled_shortfall=False), "logistics", False),
    (dict(order_id="D", channel="modern_trade", sku_id="S", sku_category="personal_care",
          order_qty=300, unit_value=40, promised_date=21, forecast_qty=250,
          actual_period_demand=360, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=220, picked_qty=220,
          pick_ready_date=18, dispatch_date=18, lane="L", lane_sla_days=2,
          delivered_date=20, delivered_qty=220, redelivered=False,
          cancelled_shortfall=True), "demand", False),
    (dict(order_id="E", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=200, unit_value=50, promised_date=21, forecast_qty=160,
          actual_period_demand=200, po_qty=65, po_promised_receipt_date=10,
          actual_goods_receipt_date=16, on_hand_at_pick=140, picked_qty=140,
          pick_ready_date=18, dispatch_date=18, lane="L", lane_sla_days=2,
          delivered_date=20, delivered_qty=140, redelivered=True,
          cancelled_shortfall=False), "supplier", True),
    (dict(order_id="F", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=80, unit_value=100, promised_date=22, forecast_qty=80,
          actual_period_demand=82, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=120, picked_qty=80,
          pick_ready_date=18, dispatch_date=20, lane="L", lane_sla_days=2,
          delivered_date=24, delivered_qty=80, redelivered=False,
          cancelled_shortfall=False), "warehouse", True),
]


def _batch():
    return [
        LabeledOrder(order=Order(**raw), planted_driver=lab,
                     planted_is_ambiguous=amb, fired=())
        for (raw, lab, amb) in _FX
    ]


def _ids(views):
    return sorted(v["order"]["order_id"] for v in views)


def test_routing_counts():
    p = prep_partition(_batch())
    assert _ids(p.by_specialist["demand"]) == ["D", "E"]
    assert _ids(p.by_specialist["supplier"]) == ["A", "E"]
    assert _ids(p.by_specialist["warehouse"]) == ["B", "F"]
    assert _ids(p.by_specialist["logistics"]) == ["C", "F"]


def test_total_claims_equals_fired_sum():
    p = prep_partition(_batch())
    total = sum(len(v) for v in p.by_specialist.values())
    assert total == 8


def test_assignments_match_fired_sets():
    p = prep_partition(_batch())
    assert p.assignments["A"] == ("supplier",)
    assert p.assignments["D"] == ("demand",)
    assert p.assignments["E"] == ("demand", "supplier")
    assert p.assignments["F"] == ("logistics", "warehouse")


def test_clean_routes_to_one_ambiguous_to_two():
    p = prep_partition(_batch())
    for oid in ("A", "B", "C", "D"):
        assert len(p.assignments[oid]) == 1
    for oid in ("E", "F"):
        assert len(p.assignments[oid]) == 2


def test_every_order_assigned():
    batch = _batch()
    p = prep_partition(batch)
    assert set(p.assignments.keys()) == {lo.order.order_id for lo in batch}


def test_firewall_no_label_in_partition():
    p = prep_partition(_batch())
    flat = str(p.by_specialist)
    assert "planted" not in flat
    for views in p.by_specialist.values():
        for v in views:
            assert set(v.keys()) == {"order", "signals"}
            assert "planted_driver" not in v
            assert "planted_is_ambiguous" not in v
