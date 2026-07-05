"""rollup proven over five fixtures with hand-verified financial impacts:
A=550 (supplier), B=590 (warehouse), C=144 (logistics), D=624 (demand),
E=550 (supplier). Every total and share below is checkable with a calculator."""
import pytest

from otif.types import Order
from otif.generator import LabeledOrder
from otif.pipeline import rollup, Rollup, DriverRollup

_FX = [
    (dict(order_id="A", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=200, unit_value=50, promised_date=20, forecast_qty=200,
          actual_period_demand=205, po_qty=60, po_promised_receipt_date=10,
          actual_goods_receipt_date=16, on_hand_at_pick=150, picked_qty=150,
          pick_ready_date=17, dispatch_date=17, lane="L", lane_sla_days=2,
          delivered_date=19, delivered_qty=150, redelivered=True,
          cancelled_shortfall=False)),
    (dict(order_id="B", channel="pharmacy", sku_id="S", sku_category="chilled",
          order_qty=100, unit_value=80, promised_date=18, forecast_qty=100,
          actual_period_demand=98, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=130, picked_qty=85,
          pick_ready_date=15, dispatch_date=15, lane="L", lane_sla_days=2,
          delivered_date=17, delivered_qty=85, redelivered=True,
          cancelled_shortfall=False)),
    (dict(order_id="C", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=60, unit_value=120, promised_date=22, forecast_qty=60,
          actual_period_demand=58, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=80, picked_qty=60,
          pick_ready_date=20, dispatch_date=20, lane="L", lane_sla_days=2,
          delivered_date=24, delivered_qty=60, redelivered=False,
          cancelled_shortfall=False)),
    (dict(order_id="D", channel="modern_trade", sku_id="S", sku_category="personal_care",
          order_qty=300, unit_value=40, promised_date=21, forecast_qty=250,
          actual_period_demand=360, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=220, picked_qty=220,
          pick_ready_date=18, dispatch_date=18, lane="L", lane_sla_days=2,
          delivered_date=20, delivered_qty=220, redelivered=False,
          cancelled_shortfall=True)),
    (dict(order_id="E", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=200, unit_value=50, promised_date=21, forecast_qty=160,
          actual_period_demand=200, po_qty=65, po_promised_receipt_date=10,
          actual_goods_receipt_date=16, on_hand_at_pick=140, picked_qty=140,
          pick_ready_date=18, dispatch_date=18, lane="L", lane_sla_days=2,
          delivered_date=20, delivered_qty=140, redelivered=True,
          cancelled_shortfall=False)),
]


def _batch():
    return [
        LabeledOrder(order=Order(**raw), planted_driver="demand",
                     planted_is_ambiguous=False, fired=())
        for (raw,) in [(r,) for r in _FX]
    ]


_ATTR = {"A": "supplier", "B": "warehouse", "C": "logistics", "D": "demand", "E": "supplier"}


def _row(rollup_result, driver):
    return next(r for r in rollup_result.by_driver if r.driver == driver)


def test_rollup_totals():
    r = rollup(_batch(), _ATTR)
    assert r.total_cash == pytest.approx(2458.0)
    assert r.total_orders == 5


def test_rollup_cash_and_counts_by_driver():
    r = rollup(_batch(), _ATTR)
    assert _row(r, "supplier").cash == pytest.approx(1100.0)
    assert _row(r, "supplier").order_count == 2
    assert _row(r, "warehouse").cash == pytest.approx(590.0)
    assert _row(r, "demand").cash == pytest.approx(624.0)
    assert _row(r, "logistics").cash == pytest.approx(144.0)


def test_rollup_shares():
    r = rollup(_batch(), _ATTR)
    assert _row(r, "supplier").cash_share == pytest.approx(1100 / 2458)
    assert _row(r, "supplier").count_share == pytest.approx(2 / 5)
    assert _row(r, "logistics").cash_share == pytest.approx(144 / 2458)
    total_share = sum(row.cash_share for row in r.by_driver)
    assert total_share == pytest.approx(1.0)


def test_rollup_ranked_by_cash_desc():
    r = rollup(_batch(), _ATTR)
    order = [row.driver for row in r.by_driver]
    assert order == ["supplier", "demand", "warehouse", "logistics"]


def test_rollup_buckets_by_attribution_not_label():
    batch = _batch()
    attr = {lo.order.order_id: "demand" for lo in batch}
    r = rollup(batch, attr)
    assert _row(r, "demand").cash == pytest.approx(2458.0)
    assert _row(r, "demand").order_count == 5
    assert _row(r, "supplier").cash == pytest.approx(0.0)
    assert _row(r, "supplier").order_count == 0


def test_all_four_drivers_present_even_when_zero():
    batch = _batch()
    attr = {lo.order.order_id: "demand" for lo in batch}
    r = rollup(batch, attr)
    assert len(r.by_driver) == 4
    assert {row.driver for row in r.by_driver} == {"demand", "supplier", "warehouse", "logistics"}


def test_missing_attribution_raises():
    batch = _batch()
    attr = dict(_ATTR)
    del attr["C"]
    with pytest.raises(ValueError):
        rollup(batch, attr)


def test_invalid_driver_raises():
    batch = _batch()
    attr = dict(_ATTR)
    attr["A"] = "Supplier"
    with pytest.raises(ValueError):
        rollup(batch, attr)
