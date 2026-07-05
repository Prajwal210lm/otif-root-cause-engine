"""Specialist contract tests. The prompt-builder is checked for the firewall
(signals present, label never) and domain-appropriate content. The parser is
checked against the schema contract the coordinator depends on."""
import json
import pytest

from otif.types import Order
from otif.generator import LabeledOrder, agent_view
from otif.specialists import (
    build_specialist_prompt,
    parse_specialist_report,
    SpecialistReport,
    SpecialistClaim,
    STANCES,
    CONFIDENCES,
    SPECIALIST_DOMAINS,
    DOMAIN_MODEL,
)

_RAW_A = dict(order_id="A", channel="modern_trade", sku_id="S", sku_category="ambient",
              order_qty=200, unit_value=50, promised_date=20, forecast_qty=200,
              actual_period_demand=205, po_qty=60, po_promised_receipt_date=10,
              actual_goods_receipt_date=16, on_hand_at_pick=150, picked_qty=150,
              pick_ready_date=17, dispatch_date=17, lane="L", lane_sla_days=2,
              delivered_date=19, delivered_qty=150, redelivered=True,
              cancelled_shortfall=False)


def _views():
    lo = LabeledOrder(order=Order(**_RAW_A), planted_driver="supplier",
                      planted_is_ambiguous=False, fired=("supplier",))
    return [agent_view(lo)]


def test_build_returns_system_and_user():
    p = build_specialist_prompt("supplier", _views())
    assert set(p.keys()) == {"system", "user"}
    assert isinstance(p["system"], str) and isinstance(p["user"], str)


def test_firewall_no_label_in_prompt():
    p = build_specialist_prompt("supplier", _views())
    blob = p["system"] + p["user"]
    assert "planted" not in blob
    assert "planted_driver" not in blob
    assert "planted_is_ambiguous" not in blob


def test_user_contains_signals_and_order_id():
    p = build_specialist_prompt("supplier", _views())
    assert "supplier_late_days" in p["user"]
    assert "shortfall_units" in p["user"]
    assert "\"order_id\": \"A\"" in p["user"]


def test_system_contains_domain_model_and_schema():
    p = build_specialist_prompt("supplier", _views())
    assert DOMAIN_MODEL["supplier"][:30] in p["system"]
    assert "strict JSON" in p["system"]
    assert "binding|contributing|incidental" in p["system"]


def test_each_domain_builds_distinct_system():
    systems = {d: build_specialist_prompt(d, _views())["system"] for d in SPECIALIST_DOMAINS}
    assert len(set(systems.values())) == 4
    assert "po_qty" in systems["supplier"]
    assert "forecast_qty" in systems["demand"]
    assert "stock_sufficient_at_pick" in systems["warehouse"]
    assert "transit overage" in systems["logistics"]


def test_empty_views_still_builds():
    p = build_specialist_prompt("warehouse", [])
    assert "system" in p and "user" in p


def test_unknown_domain_raises():
    with pytest.raises(ValueError):
        build_specialist_prompt("procurement", _views())


def _good_raw():
    return {
        "domain": "supplier",
        "pattern": "Supplier lateness clusters on a few SKUs.",
        "claims": [
            {"order_id": "X1", "stance": "binding", "confidence": "high",
             "reasoning": "PO carried enough to fill the short.",
             "cited_signals": {"po_qty": 65, "shortfall_units": 60}},
            {"order_id": "X2", "stance": "contributing", "confidence": "medium",
             "reasoning": "Late but the gap is larger than the PO.",
             "cited_signals": {"supplier_late_days": 4}},
        ],
    }


def test_parse_valid_report():
    rep = parse_specialist_report(_good_raw(), "supplier", {"X1", "X2"})
    assert isinstance(rep, SpecialistReport)
    assert rep.domain == "supplier"
    assert len(rep.claims) == 2
    assert all(isinstance(c, SpecialistClaim) for c in rep.claims)
    assert rep.claims[0].stance == "binding"


def test_parse_domain_mismatch_raises():
    raw = _good_raw(); raw["domain"] = "demand"
    with pytest.raises(ValueError):
        parse_specialist_report(raw, "supplier", {"X1", "X2"})


def test_parse_unassigned_order_raises():
    raw = _good_raw(); raw["claims"][0]["order_id"] = "ZZ"
    with pytest.raises(ValueError):
        parse_specialist_report(raw, "supplier", {"X1", "X2"})


def test_parse_missing_order_raises():
    raw = _good_raw(); raw["claims"] = raw["claims"][:1]
    with pytest.raises(ValueError):
        parse_specialist_report(raw, "supplier", {"X1", "X2"})


def test_parse_invalid_stance_raises():
    raw = _good_raw(); raw["claims"][0]["stance"] = "guilty"
    with pytest.raises(ValueError):
        parse_specialist_report(raw, "supplier", {"X1", "X2"})


def test_parse_invalid_confidence_raises():
    raw = _good_raw(); raw["claims"][1]["confidence"] = "certain"
    with pytest.raises(ValueError):
        parse_specialist_report(raw, "supplier", {"X1", "X2"})


def test_parse_empty_reasoning_raises():
    raw = _good_raw(); raw["claims"][0]["reasoning"] = "   "
    with pytest.raises(ValueError):
        parse_specialist_report(raw, "supplier", {"X1", "X2"})


def test_parse_duplicate_claim_raises():
    raw = _good_raw(); raw["claims"].append(dict(raw["claims"][0]))
    with pytest.raises(ValueError):
        parse_specialist_report(raw, "supplier", {"X1", "X2"})
