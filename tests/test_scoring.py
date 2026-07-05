"""Scorer proven against the nine engine fixtures, where naive-vs-label is
already hand-verified. Building a labeled batch from them lets every expected
accuracy be derived by hand, not against generated data."""
import pytest

from otif.types import Order
from otif.generator import LabeledOrder
from otif.scoring import (
    Scorecard,
    score_predictions,
    naive_scorecard,
    compute_lift,
    score_run,
)

_FX = [
    (dict(order_id="A", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=200, unit_value=50, promised_date=20, forecast_qty=200,
          actual_period_demand=205, po_qty=60, po_promised_receipt_date=10,
          actual_goods_receipt_date=16, on_hand_at_pick=150, picked_qty=150,
          pick_ready_date=17, dispatch_date=17, lane="L", lane_sla_days=2,
          delivered_date=19, delivered_qty=150, redelivered=True,
          cancelled_shortfall=False), "supplier", False, "supplier"),
    (dict(order_id="B", channel="pharmacy", sku_id="S", sku_category="chilled",
          order_qty=100, unit_value=80, promised_date=18, forecast_qty=100,
          actual_period_demand=98, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=130, picked_qty=85,
          pick_ready_date=15, dispatch_date=15, lane="L", lane_sla_days=2,
          delivered_date=17, delivered_qty=85, redelivered=True,
          cancelled_shortfall=False), "warehouse", False, "warehouse"),
    (dict(order_id="C", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=60, unit_value=120, promised_date=22, forecast_qty=60,
          actual_period_demand=58, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=80, picked_qty=60,
          pick_ready_date=20, dispatch_date=20, lane="L", lane_sla_days=2,
          delivered_date=24, delivered_qty=60, redelivered=False,
          cancelled_shortfall=False), "logistics", False, "logistics"),
    (dict(order_id="D", channel="modern_trade", sku_id="S", sku_category="personal_care",
          order_qty=300, unit_value=40, promised_date=21, forecast_qty=250,
          actual_period_demand=360, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=220, picked_qty=220,
          pick_ready_date=18, dispatch_date=18, lane="L", lane_sla_days=2,
          delivered_date=20, delivered_qty=220, redelivered=False,
          cancelled_shortfall=True), "demand", False, "demand"),
    (dict(order_id="E", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=200, unit_value=50, promised_date=21, forecast_qty=160,
          actual_period_demand=200, po_qty=65, po_promised_receipt_date=10,
          actual_goods_receipt_date=16, on_hand_at_pick=140, picked_qty=140,
          pick_ready_date=18, dispatch_date=18, lane="L", lane_sla_days=2,
          delivered_date=20, delivered_qty=140, redelivered=True,
          cancelled_shortfall=False), "supplier", True, "demand"),
    (dict(order_id="F", channel="modern_trade", sku_id="S", sku_category="ambient",
          order_qty=80, unit_value=100, promised_date=22, forecast_qty=80,
          actual_period_demand=82, po_qty=0, po_promised_receipt_date=10,
          actual_goods_receipt_date=10, on_hand_at_pick=120, picked_qty=80,
          pick_ready_date=18, dispatch_date=20, lane="L", lane_sla_days=2,
          delivered_date=24, delivered_qty=80, redelivered=False,
          cancelled_shortfall=False), "warehouse", True, "warehouse"),
    (dict(order_id="G", channel="pharmacy", sku_id="S", sku_category="chilled",
          order_qty=150, unit_value=60, promised_date=20, forecast_qty=150,
          actual_period_demand=152, po_qty=40, po_promised_receipt_date=10,
          actual_goods_receipt_date=15, on_hand_at_pick=120, picked_qty=120,
          pick_ready_date=17, dispatch_date=19, lane="L", lane_sla_days=2,
          delivered_date=21, delivered_qty=120, redelivered=True,
          cancelled_shortfall=False), "supplier", True, "warehouse"),
    (dict(order_id="H", channel="modern_trade", sku_id="S", sku_category="personal_care",
          order_qty=300, unit_value=30, promised_date=22, forecast_qty=240,
          actual_period_demand=300, po_qty=70, po_promised_receipt_date=10,
          actual_goods_receipt_date=18, on_hand_at_pick=200, picked_qty=200,
          pick_ready_date=18, dispatch_date=18, lane="L", lane_sla_days=2,
          delivered_date=20, delivered_qty=200, redelivered=False,
          cancelled_shortfall=True), "supplier", True, "demand"),
    (dict(order_id="I", channel="pharmacy", sku_id="S", sku_category="chilled",
          order_qty=100, unit_value=70, promised_date=20, forecast_qty=100,
          actual_period_demand=114, po_qty=30, po_promised_receipt_date=10,
          actual_goods_receipt_date=14, on_hand_at_pick=80, picked_qty=80,
          pick_ready_date=17, dispatch_date=17, lane="L", lane_sla_days=2,
          delivered_date=19, delivered_qty=80, redelivered=True,
          cancelled_shortfall=False), "supplier", False, "supplier"),
]


def _batch():
    return [
        LabeledOrder(order=Order(**raw), planted_driver=lab,
                     planted_is_ambiguous=amb, fired=())
        for (raw, lab, amb, _naive) in _FX
    ]


def test_naive_scorecard_counts():
    sc = naive_scorecard(_batch())
    assert sc.n_total == 9
    assert sc.n_clean == 5
    assert sc.n_ambiguous == 4
    assert sc.clean_correct == 5
    assert sc.ambiguous_correct == 1
    assert sc.overall_correct == 6


def test_naive_scorecard_accuracies():
    sc = naive_scorecard(_batch())
    assert sc.overall_accuracy == pytest.approx(6 / 9)
    assert sc.clean_accuracy == pytest.approx(1.0)
    assert sc.ambiguous_accuracy == pytest.approx(0.25)


def test_perfect_predictions_score_100():
    batch = _batch()
    preds = {lo.order.order_id: lo.planted_driver for lo in batch}
    sc = score_predictions(batch, preds)
    assert sc.overall_correct == 9
    assert sc.clean_correct == 5
    assert sc.ambiguous_correct == 4
    assert sc.overall_accuracy == pytest.approx(1.0)
    assert sc.ambiguous_accuracy == pytest.approx(1.0)


def test_custom_predictions_known_fractions():
    batch = _batch()
    preds = {lo.order.order_id: "supplier" for lo in batch}
    sc = score_predictions(batch, preds)
    assert sc.clean_correct == 2
    assert sc.ambiguous_correct == 3
    assert sc.overall_correct == 5


def test_missing_prediction_raises():
    batch = _batch()
    preds = {lo.order.order_id: "demand" for lo in batch}
    del preds["E"]
    with pytest.raises(ValueError):
        score_predictions(batch, preds)


def test_invalid_driver_raises():
    batch = _batch()
    preds = {lo.order.order_id: "demand" for lo in batch}
    preds["A"] = "Supplier"
    with pytest.raises(ValueError):
        score_predictions(batch, preds)


def test_lift_perfect_over_naive():
    batch = _batch()
    preds = {lo.order.order_id: lo.planted_driver for lo in batch}
    card, naive, lift = score_run(batch, preds)
    assert lift.clean == pytest.approx(0.0)
    assert lift.ambiguous == pytest.approx(1.0 - 0.25)
    assert lift.overall == pytest.approx(1.0 - 6 / 9)


def test_lift_handles_empty_slice():
    batch = [lo for lo in _batch() if not lo.planted_is_ambiguous]
    preds = {lo.order.order_id: lo.planted_driver for lo in batch}
    card, naive, lift = score_run(batch, preds)
    assert card.ambiguous_accuracy is None
    assert lift.ambiguous is None
    assert lift.clean == pytest.approx(0.0)
