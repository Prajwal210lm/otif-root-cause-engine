"""Canonical-run cache. Serializes the demo-relevant fields of a PipelineResult to
a committed JSON artifact so the live brief, scorecard, and cash distribution can be
shown without re-spending API credits. The deterministic spine is reproducible; the
one expensive thing (the model's attributions) is captured here once.

The cache is self-documenting: a top-level "meta" block records the model, an ISO
8601 timestamp, the git commit the run was produced from, and the token usage, so
regenerating the canonical run auto-stamps its own provenance. The frontend never
reads "meta"; it exists for anyone opening the JSON directly."""
import json
import os
import subprocess
from datetime import datetime, timezone

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _git_sha() -> str:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=_ROOT,
            capture_output=True, text=True, timeout=5,
        )
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    return "unknown"


def _scorecard_dict(sc) -> dict:
    return {
        "n_total": sc.n_total, "n_clean": sc.n_clean, "n_ambiguous": sc.n_ambiguous,
        "overall_correct": sc.overall_correct, "clean_correct": sc.clean_correct,
        "ambiguous_correct": sc.ambiguous_correct,
        "overall_accuracy": sc.overall_accuracy, "clean_accuracy": sc.clean_accuracy,
        "ambiguous_accuracy": sc.ambiguous_accuracy,
    }


def result_to_dict(result, seed: int, n: int, *, model: str = "unknown",
                   total_input_tokens=None, total_output_tokens=None) -> dict:
    r = result.rollup
    return {
        "seed": seed,
        "n": n,
        "rendered_brief": result.render.rendered,
        "render_ok": result.render.ok,
        "render_violations": list(result.render.violations),
        "attribution_violations": list(result.attribution_violations),
        "scorecard": _scorecard_dict(result.scorecard),
        "naive": _scorecard_dict(result.naive),
        "lift": {"overall": result.lift.overall, "clean": result.lift.clean,
                 "ambiguous": result.lift.ambiguous},
        "rollup": {
            "total_cash": r.total_cash, "total_orders": r.total_orders,
            "by_driver": [
                {"driver": x.driver, "cash": x.cash, "cash_share": x.cash_share,
                 "order_count": x.order_count, "count_share": x.count_share}
                for x in r.by_driver
            ],
        },
        "attributions": dict(result.attributions),
        "meta": {
            "model": model,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "git_sha": _git_sha(),
            "total_input_tokens": total_input_tokens,
            "total_output_tokens": total_output_tokens,
        },
    }


def save_canonical(result, path: str, seed: int = 42, n: int = 140, *, model: str = "unknown",
                   total_input_tokens=None, total_output_tokens=None) -> dict:
    data = result_to_dict(result, seed=seed, n=n, model=model,
                          total_input_tokens=total_input_tokens,
                          total_output_tokens=total_output_tokens)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return data


def load_canonical(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
