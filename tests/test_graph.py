"""LangGraph wiring tests. The compiled graph must have the fan-out/fan-in
topology and must produce the SAME result as the proven linear run_pipeline, so
the graph is a faithful re-expression of the orchestration, not a reimplementation."""
import json
import pytest

from otif.constants import DRIVERS
from otif.generator import generate_batch
from otif.pipeline import prep_partition
from otif.orchestrate import run_pipeline, PipelineResult
from otif.graph import build_graph, run_graph


class MockLLM:
    """Schema-valid fake model, identical contract to the orchestration mock."""

    def __init__(self, assignments):
        self.assignments = assignments
        self.by_domain = {
            d: sorted(oid for oid, f in assignments.items() if d in f) for d in DRIVERS
        }
        self.all_ids = sorted(assignments)

    def __call__(self, system, user):
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


def test_graph_topology():
    app = build_graph(MockLLM({}))
    nodes = set(app.get_graph().nodes)
    for expected in ("prep", "coordinator", "finalize",
                     "specialist_demand", "specialist_supplier",
                     "specialist_warehouse", "specialist_logistics"):
        assert expected in nodes


def test_graph_runs_end_to_end():
    batch = generate_batch()
    res = run_graph(batch, _mock_for(batch))
    assert isinstance(res, PipelineResult)
    assert set(res.attributions.keys()) == {lo.order.order_id for lo in batch}
    assert res.render.ok
    assert res.attribution_violations == ()


def test_graph_collects_four_reports():
    batch = generate_batch()
    res = run_graph(batch, _mock_for(batch))
    assert set(res.reports.keys()) == set(DRIVERS)


def test_graph_equals_linear_pipeline():
    batch = generate_batch()
    graph_res = run_graph(batch, _mock_for(batch))
    linear_res = run_pipeline(batch, _mock_for(batch))
    assert graph_res.attributions == linear_res.attributions
    assert graph_res.scorecard.overall_accuracy == linear_res.scorecard.overall_accuracy
    assert graph_res.scorecard.ambiguous_accuracy == linear_res.scorecard.ambiguous_accuracy
    assert graph_res.rollup.total_cash == linear_res.rollup.total_cash


def test_graph_deterministic():
    batch = generate_batch()
    a = run_graph(batch, _mock_for(batch))
    b = run_graph(batch, _mock_for(batch))
    assert a.attributions == b.attributions
