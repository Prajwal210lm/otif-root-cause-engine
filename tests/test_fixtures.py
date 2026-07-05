import pytest

from otif import engine
from otif.constants import DRIVERS
from otif.types import Order

# Each fixture pairs a "raw" dict (all Order fields) with hand-derived "expected"
# values. These expected values are the source of truth: do NOT recompute them.
FIXTURES = [
    {
        "raw": {
            "order_id": "A",
            "channel": "modern_trade",
            "sku_id": "SKU-A",
            "sku_category": "ambient",
            "order_qty": 200,
            "unit_value": 50.0,
            "promised_date": 20,
            "forecast_qty": 200,
            "actual_period_demand": 205,
            "po_qty": 60,
            "po_promised_receipt_date": 10,
            "actual_goods_receipt_date": 16,
            "on_hand_at_pick": 150,
            "picked_qty": 150,
            "pick_ready_date": 17,
            "dispatch_date": 17,
            "lane": "lane-A",
            "lane_sla_days": 2,
            "delivered_date": 19,
            "delivered_qty": 150,
            "redelivered": True,
            "cancelled_shortfall": False,
        },
        "expected": {
            "order_value": 10000.0,
            "forecast_error_pct": 0.025,
            "supplier_late_days": 6,
            "stock_sufficient_at_pick": False,
            "pick_short_units": 50,
            "dispatch_delay_days": 0,
            "transit_overage_days": 0,
            "shortfall_units": 50,
            "shortfall_value": 2500.0,
            "fired": {"supplier"},
            "saves": {"supplier": True},
            "penalty": 200.0,
            "recovery_cost": 350.0,
            "lost_margin": 0.0,
            "total": 550.0,
            "naive": "supplier",
            "label": "supplier",
        },
    },
    {
        "raw": {
            "order_id": "B",
            "channel": "pharmacy",
            "sku_id": "SKU-B",
            "sku_category": "ambient",
            "order_qty": 100,
            "unit_value": 80.0,
            "promised_date": 18,
            "forecast_qty": 100,
            "actual_period_demand": 98,
            "po_qty": 0,
            "po_promised_receipt_date": 10,
            "actual_goods_receipt_date": 10,
            "on_hand_at_pick": 130,
            "picked_qty": 85,
            "pick_ready_date": 15,
            "dispatch_date": 15,
            "lane": "lane-B",
            "lane_sla_days": 2,
            "delivered_date": 17,
            "delivered_qty": 85,
            "redelivered": True,
            "cancelled_shortfall": False,
        },
        "expected": {
            "order_value": 8000.0,
            "forecast_error_pct": -0.02,
            "supplier_late_days": 0,
            "stock_sufficient_at_pick": True,
            "pick_short_units": 15,
            "dispatch_delay_days": 0,
            "transit_overage_days": 0,
            "shortfall_units": 15,
            "shortfall_value": 1200.0,
            "fired": {"warehouse"},
            "saves": {"warehouse": True},
            "penalty": 240.0,
            "recovery_cost": 350.0,
            "lost_margin": 0.0,
            "total": 590.0,
            "naive": "warehouse",
            "label": "warehouse",
        },
    },
    {
        "raw": {
            "order_id": "C",
            "channel": "modern_trade",
            "sku_id": "SKU-C",
            "sku_category": "ambient",
            "order_qty": 60,
            "unit_value": 120.0,
            "promised_date": 22,
            "forecast_qty": 60,
            "actual_period_demand": 58,
            "po_qty": 0,
            "po_promised_receipt_date": 10,
            "actual_goods_receipt_date": 10,
            "on_hand_at_pick": 80,
            "picked_qty": 60,
            "pick_ready_date": 20,
            "dispatch_date": 20,
            "lane": "lane-C",
            "lane_sla_days": 2,
            "delivered_date": 24,
            "delivered_qty": 60,
            "redelivered": False,
            "cancelled_shortfall": False,
        },
        "expected": {
            "order_value": 7200.0,
            "forecast_error_pct": -0.0333,
            "supplier_late_days": 0,
            "stock_sufficient_at_pick": True,
            "pick_short_units": 0,
            "dispatch_delay_days": 0,
            "transit_overage_days": 2,
            "shortfall_units": 0,
            "shortfall_value": 0.0,
            "fired": {"logistics"},
            "saves": {"logistics": True},
            "penalty": 144.0,
            "recovery_cost": 0.0,
            "lost_margin": 0.0,
            "total": 144.0,
            "naive": "logistics",
            "label": "logistics",
        },
    },
    {
        "raw": {
            "order_id": "D",
            "channel": "modern_trade",
            "sku_id": "SKU-D",
            "sku_category": "ambient",
            "order_qty": 300,
            "unit_value": 40.0,
            "promised_date": 21,
            "forecast_qty": 250,
            "actual_period_demand": 360,
            "po_qty": 0,
            "po_promised_receipt_date": 10,
            "actual_goods_receipt_date": 10,
            "on_hand_at_pick": 220,
            "picked_qty": 220,
            "pick_ready_date": 18,
            "dispatch_date": 18,
            "lane": "lane-D",
            "lane_sla_days": 2,
            "delivered_date": 20,
            "delivered_qty": 220,
            "redelivered": False,
            "cancelled_shortfall": True,
        },
        "expected": {
            "order_value": 12000.0,
            "forecast_error_pct": 0.44,
            "supplier_late_days": 0,
            "stock_sufficient_at_pick": False,
            "pick_short_units": 80,
            "dispatch_delay_days": 0,
            "transit_overage_days": 0,
            "shortfall_units": 80,
            "shortfall_value": 3200.0,
            "fired": {"demand"},
            "saves": {"demand": True},
            "penalty": 240.0,
            "recovery_cost": 0.0,
            "lost_margin": 384.0,
            "total": 624.0,
            "naive": "demand",
            "label": "demand",
        },
    },
    {
        "raw": {
            "order_id": "E",
            "channel": "modern_trade",
            "sku_id": "SKU-E",
            "sku_category": "ambient",
            "order_qty": 200,
            "unit_value": 50.0,
            "promised_date": 21,
            "forecast_qty": 160,
            "actual_period_demand": 200,
            "po_qty": 65,
            "po_promised_receipt_date": 10,
            "actual_goods_receipt_date": 16,
            "on_hand_at_pick": 140,
            "picked_qty": 140,
            "pick_ready_date": 18,
            "dispatch_date": 18,
            "lane": "lane-E",
            "lane_sla_days": 2,
            "delivered_date": 20,
            "delivered_qty": 140,
            "redelivered": True,
            "cancelled_shortfall": False,
        },
        "expected": {
            "order_value": 10000.0,
            "forecast_error_pct": 0.25,
            "supplier_late_days": 6,
            "stock_sufficient_at_pick": False,
            "pick_short_units": 60,
            "dispatch_delay_days": 0,
            "transit_overage_days": 0,
            "shortfall_units": 60,
            "shortfall_value": 3000.0,
            "fired": {"demand", "supplier"},
            "saves": {"demand": False, "supplier": True},
            "penalty": 200.0,
            "recovery_cost": 350.0,
            "lost_margin": 0.0,
            "total": 550.0,
            "naive": "demand",
            "label": "supplier",
        },
    },
    {
        "raw": {
            "order_id": "F",
            "channel": "modern_trade",
            "sku_id": "SKU-F",
            "sku_category": "ambient",
            "order_qty": 80,
            "unit_value": 100.0,
            "promised_date": 22,
            "forecast_qty": 80,
            "actual_period_demand": 82,
            "po_qty": 0,
            "po_promised_receipt_date": 10,
            "actual_goods_receipt_date": 10,
            "on_hand_at_pick": 120,
            "picked_qty": 80,
            "pick_ready_date": 18,
            "dispatch_date": 20,
            "lane": "lane-F",
            "lane_sla_days": 2,
            "delivered_date": 24,
            "delivered_qty": 80,
            "redelivered": False,
            "cancelled_shortfall": False,
        },
        "expected": {
            "order_value": 8000.0,
            "forecast_error_pct": 0.025,
            "supplier_late_days": 0,
            "stock_sufficient_at_pick": True,
            "pick_short_units": 0,
            "dispatch_delay_days": 2,
            "transit_overage_days": 2,
            "shortfall_units": 0,
            "shortfall_value": 0.0,
            "fired": {"warehouse", "logistics"},
            "saves": {"warehouse": True, "logistics": True},
            "penalty": 160.0,
            "recovery_cost": 0.0,
            "lost_margin": 0.0,
            "total": 160.0,
            "naive": "warehouse",
            "label": "warehouse",
        },
    },
    {
        "raw": {
            "order_id": "G",
            "channel": "pharmacy",
            "sku_id": "SKU-G",
            "sku_category": "ambient",
            "order_qty": 150,
            "unit_value": 60.0,
            "promised_date": 20,
            "forecast_qty": 150,
            "actual_period_demand": 152,
            "po_qty": 40,
            "po_promised_receipt_date": 10,
            "actual_goods_receipt_date": 15,
            "on_hand_at_pick": 120,
            "picked_qty": 120,
            "pick_ready_date": 17,
            "dispatch_date": 19,
            "lane": "lane-G",
            "lane_sla_days": 2,
            "delivered_date": 21,
            "delivered_qty": 120,
            "redelivered": True,
            "cancelled_shortfall": False,
        },
        "expected": {
            "order_value": 9000.0,
            "forecast_error_pct": 0.0133,
            "supplier_late_days": 5,
            "stock_sufficient_at_pick": False,
            "pick_short_units": 30,
            "dispatch_delay_days": 2,
            "transit_overage_days": 0,
            "shortfall_units": 30,
            "shortfall_value": 1800.0,
            "fired": {"supplier", "warehouse"},
            "saves": {"supplier": False, "warehouse": False},
            "penalty": 270.0,
            "recovery_cost": 350.0,
            "lost_margin": 0.0,
            "total": 620.0,
            "naive": "warehouse",
            "label": "supplier",
        },
    },
    {
        "raw": {
            "order_id": "H",
            "channel": "modern_trade",
            "sku_id": "SKU-H",
            "sku_category": "ambient",
            "order_qty": 300,
            "unit_value": 30.0,
            "promised_date": 22,
            "forecast_qty": 240,
            "actual_period_demand": 300,
            "po_qty": 70,
            "po_promised_receipt_date": 10,
            "actual_goods_receipt_date": 18,
            "on_hand_at_pick": 200,
            "picked_qty": 200,
            "pick_ready_date": 18,
            "dispatch_date": 18,
            "lane": "lane-H",
            "lane_sla_days": 2,
            "delivered_date": 20,
            "delivered_qty": 200,
            "redelivered": False,
            "cancelled_shortfall": True,
        },
        "expected": {
            "order_value": 9000.0,
            "forecast_error_pct": 0.25,
            "supplier_late_days": 8,
            "stock_sufficient_at_pick": False,
            "pick_short_units": 100,
            "dispatch_delay_days": 0,
            "transit_overage_days": 0,
            "shortfall_units": 100,
            "shortfall_value": 3000.0,
            "fired": {"demand", "supplier"},
            "saves": {"demand": False, "supplier": False},
            "penalty": 180.0,
            "recovery_cost": 0.0,
            "lost_margin": 360.0,
            "total": 540.0,
            "naive": "demand",
            "label": "supplier",
        },
    },
    {
        "raw": {
            "order_id": "I",
            "channel": "pharmacy",
            "sku_id": "SKU-I",
            "sku_category": "ambient",
            "order_qty": 100,
            "unit_value": 70.0,
            "promised_date": 20,
            "forecast_qty": 100,
            "actual_period_demand": 114,
            "po_qty": 30,
            "po_promised_receipt_date": 10,
            "actual_goods_receipt_date": 14,
            "on_hand_at_pick": 80,
            "picked_qty": 80,
            "pick_ready_date": 17,
            "dispatch_date": 17,
            "lane": "lane-I",
            "lane_sla_days": 2,
            "delivered_date": 19,
            "delivered_qty": 80,
            "redelivered": True,
            "cancelled_shortfall": False,
        },
        "expected": {
            "order_value": 7000.0,
            "forecast_error_pct": 0.14,
            "supplier_late_days": 4,
            "stock_sufficient_at_pick": False,
            "pick_short_units": 20,
            "dispatch_delay_days": 0,
            "transit_overage_days": 0,
            "shortfall_units": 20,
            "shortfall_value": 1400.0,
            "fired": {"supplier"},
            "saves": {"supplier": True},
            "penalty": 210.0,
            "recovery_cost": 350.0,
            "lost_margin": 0.0,
            "total": 560.0,
            "naive": "supplier",
            "label": "supplier",
        },
    },
]

IDS = [fx["raw"]["order_id"] for fx in FIXTURES]


def _fired_set(signals):
    """Collect the set of driver names whose *_fired flag is True."""
    return {d for d in DRIVERS if getattr(signals, f"{d}_fired")}


@pytest.mark.parametrize("fx", FIXTURES, ids=IDS)
def test_signals(fx):
    order = Order(**fx["raw"])
    exp = fx["expected"]
    sig = engine.compute_signals(order)

    assert sig.order_value == exp["order_value"]
    assert sig.forecast_error_pct == pytest.approx(exp["forecast_error_pct"], abs=1e-3)
    assert sig.supplier_late_days == exp["supplier_late_days"]
    assert sig.stock_sufficient_at_pick == exp["stock_sufficient_at_pick"]
    assert sig.pick_short_units == exp["pick_short_units"]
    assert sig.dispatch_delay_days == exp["dispatch_delay_days"]
    assert sig.transit_overage_days == exp["transit_overage_days"]
    assert sig.shortfall_units == exp["shortfall_units"]
    assert sig.shortfall_value == exp["shortfall_value"]
    assert _fired_set(sig) == exp["fired"]


@pytest.mark.parametrize("fx", FIXTURES, ids=IDS)
def test_financial_impact(fx):
    order = Order(**fx["raw"])
    exp = fx["expected"]
    sig = engine.compute_signals(order)
    fin = engine.compute_financial_impact(order, sig)

    assert fin.penalty == exp["penalty"]
    assert fin.recovery_cost == exp["recovery_cost"]
    assert fin.lost_margin == exp["lost_margin"]
    assert fin.total == exp["total"]


@pytest.mark.parametrize("fx", FIXTURES, ids=IDS)
def test_counterfactual_saves(fx):
    order = Order(**fx["raw"])
    exp = fx["expected"]
    sig = engine.compute_signals(order)
    cf = engine.compute_counterfactuals(order, sig)

    for driver, expected_saves in exp["saves"].items():
        assert getattr(cf, f"{driver}_saves") == expected_saves


@pytest.mark.parametrize("fx", FIXTURES, ids=IDS)
def test_naive_attribution(fx):
    order = Order(**fx["raw"])
    exp = fx["expected"]
    sig = engine.compute_signals(order)

    assert engine.naive_attribution(order, sig) == exp["naive"]


@pytest.mark.parametrize("fx", FIXTURES, ids=IDS)
def test_oracle_attribution(fx):
    order = Order(**fx["raw"])
    exp = fx["expected"]
    sig = engine.compute_signals(order)
    cf = engine.compute_counterfactuals(order, sig)

    assert engine.oracle_attribution(order, sig, cf) == exp["label"]
