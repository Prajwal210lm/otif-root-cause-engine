"""Run the live OTIF pipeline once per seed in SEEDS and cache each result under
data/robustness/. THIS SPENDS API CREDITS (5 LLM calls per seed). Requires
ANTHROPIC_API_KEY in the environment.

Each seed's result is saved immediately after it completes, so a failure partway
through does not lose the credits already spent on earlier seeds. On any failure,
the script stops (does not continue to remaining seeds, does not retry).

Usage (PowerShell):
    $env:ANTHROPIC_API_KEY="sk-ant-..."
    python scripts\\run_robustness.py [seed ...]

With no arguments, runs the default SEEDS. Pass explicit seeds to run a subset
(e.g. `python scripts\\run_robustness.py 46 47` to pick up where an earlier
partial run left off).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from otif.generator import generate_batch
from otif.graph import run_graph
from otif.client import AnthropicClient
from otif.cache import save_canonical

SEEDS = (43, 44, 45, 46, 47)
N = 140


def main():
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY is not set. Aborting before any spend.")
        return 1
    seeds = tuple(int(a) for a in sys.argv[1:]) if len(sys.argv) > 1 else SEEDS
    out_dir = os.path.join("data", "robustness")
    os.makedirs(out_dir, exist_ok=True)

    for seed in seeds:
        path = os.path.join(out_dir, f"seed_{seed}.json")
        print(f"\n=== seed {seed} (N={N}) ===")
        print("Running live multi-agent pipeline "
              "(5 LLM calls: 4 specialists in parallel + 1 coordinator). This spends credits.")
        batch = generate_batch(seed=seed, n=N)
        llm = AnthropicClient()
        try:
            result = run_graph(batch, llm)
        except Exception:
            print(f"FAILED on seed {seed}. Stopping — not attempting remaining seeds.")
            raise
        save_canonical(
            result, path, seed=seed, n=N,
            model=llm.model,
            total_input_tokens=llm.total_input_tokens,
            total_output_tokens=llm.total_output_tokens,
        )
        sc, nv, lf = result.scorecard, result.naive, result.lift
        print(f"render ok:              {result.render.ok}")
        print(f"attribution violations: {result.attribution_violations}")
        print(f"coordinator accuracy:   overall {sc.overall_accuracy*100:.1f}%  "
              f"clean {sc.clean_accuracy*100:.1f}%  ambiguous {sc.ambiguous_accuracy*100:.1f}%")
        print(f"naive floor:            ambiguous {nv.ambiguous_accuracy*100:.1f}%")
        print(f"LIFT on ambiguous:      {lf.ambiguous*100:+.1f} points")
        print(f"saved -> {path}")

    print("\nAll seeds complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
