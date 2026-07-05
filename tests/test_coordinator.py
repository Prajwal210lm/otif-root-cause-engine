"""Coordinator contract tests. The prompt-builder is checked for the placeholder
vocabulary, the firewall, and the deliberate ABSENCE of the oracle's precedence
rules (anti-theater). The parser and reconciler enforce the attribution contract
the scorer and render gate depend on."""
import json
import pytest

from otif.coordinator import (
    build_coordinator_prompt,
    parse_coordinator_output,
    reconcile_attributions,
    CoordinatorOutput,
    PLACEHOLDER_VOCAB,
)

_PATTERNS = {
    "demand": "Forecast misses cluster on promo SKUs.",
    "supplier": "Lateness clusters on two vendors.",
    "warehouse": "Pick errors in the chilled zone.",
    "logistics": "Northern Emirates lane runs slow.",
}

_BLOCKS = [
    {"order_id": "C1", "signals": {"supplier_late_days": 6, "shortfall_units": 50},
     "claims": [{"domain": "supplier", "stance": "binding", "confidence": "high",
                 "reasoning": "PO covered the short.", "cited_signals": {"po_qty": 60}}]},
    {"order_id": "A1", "signals": {"forecast_error_pct": 0.25, "supplier_late_days": 8,
                                    "shortfall_units": 100},
     "claims": [{"domain": "demand", "stance": "contributing", "confidence": "medium",
                 "reasoning": "Miss smaller than the short.", "cited_signals": {}},
                {"domain": "supplier", "stance": "binding", "confidence": "high",
                 "reasoning": "Bigger PO would have filled it.", "cited_signals": {}}]},
]

_ASSIGN = {"C1": ("supplier",), "A1": ("demand", "supplier")}
_IDS = {"C1", "A1"}


def test_build_returns_system_and_user():
    p = build_coordinator_prompt(_BLOCKS, _PATTERNS)
    assert set(p.keys()) == {"system", "user"}


def test_system_lists_placeholder_vocab():
    p = build_coordinator_prompt(_BLOCKS, _PATTERNS)
    assert "{{total_cash}}" in p["system"]
    assert "{{rank1_driver}}" in p["system"]
    assert "{{supplier_cash_share}}" in p["system"]
    assert "strict JSON" in p["system"]


def test_system_omits_oracle_precedence_rules():
    p = build_coordinator_prompt(_BLOCKS, _PATTERNS)
    sys = p["system"].lower()
    for banned in ("in-full dominates", "shortage outranks", "earlier link",
                   "larger contributor", "in_full", "on_time"):
        assert banned not in sys


def test_user_contains_orders_claims_and_patterns():
    p = build_coordinator_prompt(_BLOCKS, _PATTERNS)
    assert "C1" in p["user"] and "A1" in p["user"]
    assert "binding" in p["user"]
    assert "two vendors" in p["user"]


def test_firewall_no_label_in_prompt():
    p = build_coordinator_prompt(_BLOCKS, _PATTERNS)
    blob = p["system"] + p["user"]
    assert "planted" not in blob


def test_placeholder_vocab_shape():
    assert len(PLACEHOLDER_VOCAB) == 30
    assert "total_cash" in PLACEHOLDER_VOCAB
    assert "rank4_driver" in PLACEHOLDER_VOCAB
    assert "logistics_count_share" in PLACEHOLDER_VOCAB


def _good_raw():
    return {
        "attributions": {"C1": "supplier", "A1": "supplier"},
        "narrative": "Top driver {{rank1_driver}} at {{rank1_cash}}.",
    }


def test_parse_valid_output():
    out = parse_coordinator_output(_good_raw(), _IDS)
    assert isinstance(out, CoordinatorOutput)
    assert out.attributions == {"C1": "supplier", "A1": "supplier"}
    assert "{{rank1_driver}}" in out.narrative


def test_parse_missing_order_raises():
    raw = _good_raw(); del raw["attributions"]["A1"]
    with pytest.raises(ValueError):
        parse_coordinator_output(raw, _IDS)


def test_parse_extra_order_raises():
    raw = _good_raw(); raw["attributions"]["ZZ"] = "demand"
    with pytest.raises(ValueError):
        parse_coordinator_output(raw, _IDS)


def test_parse_invalid_driver_raises():
    raw = _good_raw(); raw["attributions"]["C1"] = "Supplier"
    with pytest.raises(ValueError):
        parse_coordinator_output(raw, _IDS)


def test_parse_empty_narrative_raises():
    raw = _good_raw(); raw["narrative"] = "   "
    with pytest.raises(ValueError):
        parse_coordinator_output(raw, _IDS)


def test_reconcile_clean_pass():
    v = reconcile_attributions({"C1": "supplier", "A1": "supplier"}, _ASSIGN)
    assert v == ()


def test_reconcile_clean_wrong_driver_violation():
    v = reconcile_attributions({"C1": "demand", "A1": "supplier"}, _ASSIGN)
    assert any("C1" in x for x in v)


def test_reconcile_ambiguous_either_fired_driver_passes():
    v = reconcile_attributions({"C1": "supplier", "A1": "demand"}, _ASSIGN)
    assert v == ()


def test_reconcile_ambiguous_nonfired_driver_violation():
    v = reconcile_attributions({"C1": "supplier", "A1": "warehouse"}, _ASSIGN)
    assert any("A1" in x for x in v)
