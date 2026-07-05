"""render_gate proven against a hand-built roll-up with clean percentages:
total AED 1,000 over 5 orders; supplier 500 (50% cash, 2 orders = 40% count),
demand 250 (25%), warehouse 200 (20%), logistics 50 (5%). Every rendered string
is checkable by hand."""
import pytest

from otif.pipeline import Rollup, DriverRollup
from otif.validate import render_gate, build_substitution_map, RenderResult


def _rollup():
    rows = (
        DriverRollup("supplier", 2, 500.0, 0.50, 0.40),
        DriverRollup("demand", 1, 250.0, 0.25, 0.20),
        DriverRollup("warehouse", 1, 200.0, 0.20, 0.20),
        DriverRollup("logistics", 1, 50.0, 0.05, 0.20),
    )
    return Rollup(total_cash=1000.0, total_orders=5, by_driver=rows)


def _broken_rollup():
    rows = (
        DriverRollup("supplier", 2, 500.0, 0.50, 0.40),
        DriverRollup("demand", 1, 250.0, 0.25, 0.20),
        DriverRollup("warehouse", 1, 200.0, 0.20, 0.20),
        DriverRollup("logistics", 1, 50.0, 0.05, 0.20),
    )
    return Rollup(total_cash=9999.0, total_orders=5, by_driver=rows)


def test_substitution_map_values():
    smap = build_substitution_map(_rollup())
    assert smap["total_cash"] == "AED 1,000"
    assert smap["total_orders"] == "5"
    assert smap["supplier_cash"] == "AED 500"
    assert smap["supplier_cash_share"] == "50%"
    assert smap["supplier_count_share"] == "40%"
    assert smap["logistics_cash_share"] == "5%"
    assert smap["rank1_driver"] == "supplier"
    assert smap["rank1_cash"] == "AED 500"
    assert smap["rank4_driver"] == "logistics"


def test_clean_narrative_renders():
    narrative = (
        "Total OTIF impact was {{total_cash}} across {{total_orders}} failed orders. "
        "The largest driver is {{rank1_driver}} at {{rank1_cash}} "
        "({{rank1_cash_share}} of the cash). Fix it first."
    )
    res = render_gate(narrative, _rollup())
    assert res.ok
    assert res.violations == ()
    assert "AED 1,000" in res.rendered
    assert "across 5 failed" in res.rendered
    assert "supplier at AED 500 (50% of the cash)" in res.rendered
    assert "{{" not in res.rendered


def test_spelled_out_numbers_pass():
    narrative = "Supplier lateness concentrates on three SKUs from two vendors."
    res = render_gate(narrative, _rollup())
    assert res.ok
    assert res.rendered == narrative


def test_bare_digit_rejected():
    narrative = "Supplier drove AED 500 of impact."
    res = render_gate(narrative, _rollup())
    assert not res.ok
    assert res.rendered is None
    assert any("bare digit" in v for v in res.violations)


def test_unknown_placeholder_rejected():
    narrative = "The driver was {{vendor_cash}} this month."
    res = render_gate(narrative, _rollup())
    assert not res.ok
    assert any("unknown placeholders" in v for v in res.violations)
    assert "vendor_cash" in str(res.violations)


def test_non_reconciling_rollup_rejected():
    narrative = "Total impact was {{total_cash}}."
    res = render_gate(narrative, _broken_rollup())
    assert not res.ok
    assert any("reconcile" in v for v in res.violations)


def test_rank_names_come_from_rollup():
    narrative = "{{rank1_driver}} then {{rank2_driver}} then {{rank3_driver}} then {{rank4_driver}}."
    res = render_gate(narrative, _rollup())
    assert res.ok
    assert res.rendered == "supplier then demand then warehouse then logistics."


def test_placeholder_with_whitespace_resolves():
    narrative = "Impact {{ total_cash }} over {{ total_orders }} orders."
    res = render_gate(narrative, _rollup())
    assert res.ok
    assert res.rendered == "Impact AED 1,000 over 5 orders."
