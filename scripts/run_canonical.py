"""Run the canonical live OTIF pipeline once and cache the result.
THIS SPENDS API CREDITS. Requires ANTHROPIC_API_KEY in the environment.

Usage (PowerShell):
    $env:ANTHROPIC_API_KEY="sk-ant-..."
    python scripts\run_canonical.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from otif.generator import generate_batch
from otif.graph import run_graph
from otif.client import AnthropicClient, MODEL_OPUS
from otif.cache import save_canonical


def main():
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY is not set. Aborting before any spend.")
        return 1
    os.makedirs("data", exist_ok=True)
    batch = generate_batch()  # seed 42, n 140
    print("Running live multi-agent pipeline on 140 orders")
    print("(5 LLM calls: 4 specialists in parallel + 1 coordinator). This spends credits.")
    llm = AnthropicClient()
    result = run_graph(batch, llm)
    save_canonical(
        result, os.path.join("data", "canonical_run.json"), seed=42, n=140,
        model=llm.model,
        total_input_tokens=llm.total_input_tokens,
        total_output_tokens=llm.total_output_tokens,
    )
    sc, nv, lf = result.scorecard, result.naive, result.lift
    print()
    print("=== CANONICAL RUN (seed 42, N=140) ===")
    print(f"render ok:              {result.render.ok}")
    print(f"attribution violations: {result.attribution_violations}")
    print(f"coordinator accuracy:   overall {sc.overall_accuracy*100:.1f}%  "
          f"clean {sc.clean_accuracy*100:.1f}%  ambiguous {sc.ambiguous_accuracy*100:.1f}%")
    print(f"naive floor:            ambiguous {nv.ambiguous_accuracy*100:.1f}%")
    print(f"LIFT on ambiguous:      {lf.ambiguous*100:+.1f} points  "
          f"(coordinator {sc.ambiguous_accuracy*100:.1f}% vs naive {nv.ambiguous_accuracy*100:.1f}%)")
    print("saved -> data/canonical_run.json")
    if sc.ambiguous_accuracy is not None and sc.ambiguous_accuracy < 0.65:
        print()
        print("NOTE: ambiguous accuracy is below ~65%. Per the escalation rule, consider")
        print("re-running with the coordinator on Opus only (MODEL_OPUS) and comparing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
