"""Orchestration proven end-to-end against a schema-valid mock LLM. The mock
returns valid (not smart) output, so every junction is exercised: fan-out, parse,
assemble, coordinator, reconcile, roll-up, render gate, scoring. Zero credits."""
import json
import pytest

from otif.constants import DRIVERS
from otif.generator import generate_batch
from otif.pipeline import prep_partition
from otif.orchestrate import (
    extract_json,
    run_one_specialist,
    run_specialists,
    assemble_claims,
    run_coordinator,
    run_pipeline,
    PipelineResult,
)


class MockLLM:
    """Schema-valid fake model. Specialists claim 'binding'; the coordinator
    attributes each order to a fired driver (alphabetically first of the pair),
    so attributions reconcile and the brief renders. Not accurate, just valid."""

    def __init__(self, assignments):
        self.assignments = assignments
        self.by_domain = {
            d: sorted(oid for oid, f in assignments.items() if d in f) for d in DRIVERS
        }
        self.all_ids = sorted(assignments)
        self.calls = 0

    def __call__(self, system, user):
        self.calls += 1
        if "You are the coordinator" in system:
            attributions = {oid: self.assignments[oid][0] for oid in self.all_ids}
            narrative = ("Total OTIF impact {{total_cash}} across {{total_orders}} orders. "
                         "Top driver {{rank1_driver}} at {{rank1_cash}} ({{rank1_cash_share}}).")
            return json.dumps({"attributions": attributions, "narrative": narrative})
        for d in DRIVERS:
            if f"the {d} specialist" in system:
                claims = [{"order_id": oid, "stance": "binding", "confidence": "medium",
                           "reasoning": f"mock reasoning for {oid}", "cited_signals": {}}
                          for oid in self.by_domain[d]]
                return json.dumps({"domain": d, "pattern": f"mock {d} pattern", "claims": claims})
        raise AssertionError("mock received an unrecognized system prompt")


def _mock_for(batch):
    return MockLLM(prep_partition(batch).assignments)


def test_extract_clean_json():
    assert extract_json('{"a": 1}') == {"a": 1}


def test_extract_fenced_json():
    assert extract_json('```json\n{"a": 1}\n```') == {"a": 1}


def test_extract_json_with_preamble():
    assert extract_json('Here is the result:\n{"a": 1}\nDone.') == {"a": 1}


def test_extract_json_garbage_raises():
    with pytest.raises(ValueError):
        extract_json("no json here at all")


def test_run_one_specialist_valid():
    batch = generate_batch()
    part = prep_partition(batch)
    mock = MockLLM(part.assignments)
    rep = run_one_specialist("supplier", part.by_specialist["supplier"], mock)
    assert rep.domain == "supplier"
    assert len(rep.claims) == len(part.by_specialist["supplier"])


def test_run_one_specialist_empty_views_no_call():
    mock = MockLLM({})
    rep = run_one_specialist("warehouse", [], mock)
    assert rep.claims == ()
    assert mock.calls == 0


def test_run_specialists_covers_all_domains():
    batch = generate_batch()
    part = prep_partition(batch)
    reports = run_specialists(part, MockLLM(part.assignments))
    assert set(reports.keys()) == set(DRIVERS)
    for d in DRIVERS:
        assert len(reports[d].claims) == len(part.by_specialist[d])


def test_assemble_claims_counts_match_fired():
    batch = generate_batch()
    part = prep_partition(batch)
    reports = run_specialists(part, MockLLM(part.assignments))
    blocks = assemble_claims(reports, part)
    by_id = {b["order_id"]: b for b in blocks}
    assert len(blocks) == len(part.assignments)
    for oid, fired in part.assignments.items():
        assert len(by_id[oid]["claims"]) == len(fired)
        assert "signals" in by_id[oid]


def test_run_coordinator_valid():
    batch = generate_batch()
    part = prep_partition(batch)
    mock = MockLLM(part.assignments)
    reports = run_specialists(part, mock)
    blocks = assemble_claims(reports, part)
    patterns = {d: reports[d].pattern for d in reports}
    ids = {lo.order.order_id for lo in batch}
    out = run_coordinator(blocks, patterns, ids, mock)
    assert set(out.attributions.keys()) == ids
    assert "{{rank1_driver}}" in out.narrative


def test_run_pipeline_end_to_end():
    batch = generate_batch()
    res = run_pipeline(batch, _mock_for(batch))
    assert isinstance(res, PipelineResult)
    assert set(res.attributions.keys()) == {lo.order.order_id for lo in batch}
    assert all(v in DRIVERS for v in res.attributions.values())


def test_pipeline_attributions_reconcile():
    batch = generate_batch()
    res = run_pipeline(batch, _mock_for(batch))
    assert res.attribution_violations == ()


def test_pipeline_render_ok_and_cash_reconciles():
    batch = generate_batch()
    res = run_pipeline(batch, _mock_for(batch))
    assert res.render.ok
    assert "AED" in res.render.rendered
    assert abs(sum(r.cash for r in res.rollup.by_driver) - res.rollup.total_cash) < 0.01


def test_pipeline_scorecard_has_three_numbers():
    batch = generate_batch()
    res = run_pipeline(batch, _mock_for(batch))
    for acc in (res.scorecard.overall_accuracy, res.scorecard.clean_accuracy,
                res.scorecard.ambiguous_accuracy):
        assert 0.0 <= acc <= 1.0
    assert 0.0 <= res.naive.ambiguous_accuracy <= 1.0


def test_pipeline_deterministic_with_same_mock():
    batch = generate_batch()
    a = run_pipeline(batch, _mock_for(batch))
    b = run_pipeline(batch, _mock_for(batch))
    assert a.attributions == b.attributions
