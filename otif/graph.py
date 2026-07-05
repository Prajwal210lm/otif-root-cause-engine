"""LangGraph wiring: the orchestration expressed as real topology. prep fans out
to four specialist nodes that execute concurrently, then fans back into the
coordinator, then roll-up/validate. The four nodes reuse run_one_specialist
unchanged, so the parallelism becomes graph structure, not a loop, and the proven
logic is untouched. The compiled graph is equivalent to run_pipeline."""
from typing import TypedDict, Annotated

from langgraph.graph import StateGraph, START, END

from otif.constants import DRIVERS
from otif.pipeline import prep_partition, rollup
from otif.validate import render_gate
from otif.scoring import score_run
from otif.coordinator import reconcile_attributions
from otif.orchestrate import (
    run_one_specialist,
    assemble_claims,
    run_coordinator_reconciled,
    withheld_render,
    PipelineResult,
)


def _merge_reports(left, right):
    """Reducer for the concurrent specialist writes. Each specialist node writes
    {domain: report}; the four writes merge into one reports dict."""
    left = left or {}
    return {**left, **right}


class GraphState(TypedDict):
    batch: list
    partition: object
    reports: Annotated[dict, _merge_reports]
    coord: object
    result: object


def _prep_node(state):
    return {"partition": prep_partition(state["batch"])}


def _make_specialist_node(domain, llm):
    def node(state):
        part = state["partition"]
        report = run_one_specialist(domain, part.by_specialist[domain], llm)
        return {"reports": {domain: report}}
    return node


def _make_coordinator_node(llm):
    def node(state):
        part = state["partition"]
        reports = state["reports"]
        blocks = assemble_claims(reports, part)
        patterns = {d: reports[d].pattern for d in reports}
        ids = {lo.order.order_id for lo in state["batch"]}
        # enforcement (one corrective re-prompt on violations) happens here;
        # finalize re-derives the deterministic post-retry violations
        coord, _violations = run_coordinator_reconciled(
            blocks, patterns, ids, part.assignments, llm
        )
        return {"coord": coord}
    return node


def _finalize_node(state):
    batch = state["batch"]
    part = state["partition"]
    coord = state["coord"]
    violations = reconcile_attributions(coord.attributions, part.assignments)
    r = rollup(batch, coord.attributions)
    render = withheld_render(violations) if violations else render_gate(coord.narrative, r)
    card, naive, lift = score_run(batch, coord.attributions)
    result = PipelineResult(
        attributions=coord.attributions, rollup=r, render=render, scorecard=card,
        naive=naive, lift=lift, attribution_violations=violations, reports=state["reports"],
    )
    return {"result": result}


def build_graph(llm):
    """Compile the OTIF multi-agent graph with an injected LLM callable."""
    g = StateGraph(GraphState)
    g.add_node("prep", _prep_node)
    for d in DRIVERS:
        g.add_node(f"specialist_{d}", _make_specialist_node(d, llm))
    g.add_node("coordinator", _make_coordinator_node(llm))
    g.add_node("finalize", _finalize_node)

    g.add_edge(START, "prep")
    for d in DRIVERS:
        g.add_edge("prep", f"specialist_{d}")          # fan-out
        g.add_edge(f"specialist_{d}", "coordinator")   # fan-in
    g.add_edge("coordinator", "finalize")
    g.add_edge("finalize", END)
    return g.compile()


def run_graph(batch, llm) -> PipelineResult:
    """Run the multi-agent graph end-to-end and return the PipelineResult."""
    final = build_graph(llm).invoke({"batch": batch, "reports": {}})
    return final["result"]
