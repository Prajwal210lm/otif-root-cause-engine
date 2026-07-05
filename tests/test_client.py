"""Zero-credit tests for the live wiring: the Anthropic client's response handling
(SDK mocked, no key, no spend), the canonical-run cache round-trip, and the
assemble_claims ordering determinism that makes the graph run reproducible. A live
smoke test is included but skipped unless RUN_OTIF_LIVE is set."""
import json
import os
import pytest

from otif.constants import DRIVERS
from otif.client import AnthropicClient, MODEL_SONNET, MODEL_OPUS
from otif.cache import save_canonical, load_canonical, result_to_dict
from otif.generator import generate_batch
from otif.pipeline import prep_partition
from otif.orchestrate import run_pipeline


class _Block:
    def __init__(self, text):
        self.type = "text"
        self.text = text


class _Resp:
    def __init__(self, blocks):
        self.content = blocks


class _FakeMessages:
    def __init__(self, blocks):
        self._blocks = blocks
        self.last_kwargs = None

    def create(self, **kwargs):
        self.last_kwargs = kwargs
        return _Resp(self._blocks)


class _FakeSDK:
    def __init__(self, blocks):
        self.messages = _FakeMessages(blocks)


def test_client_returns_joined_text():
    sdk = _FakeSDK([_Block('{"ok": true}')])
    client = AnthropicClient(client=sdk)
    assert client("sys", "usr") == '{"ok": true}'


def test_client_joins_multiple_text_blocks():
    sdk = _FakeSDK([_Block("part1 "), _Block("part2")])
    client = AnthropicClient(client=sdk)
    assert client("s", "u") == "part1 part2"


def test_client_passes_model_and_messages():
    sdk = _FakeSDK([_Block("x")])
    client = AnthropicClient(model=MODEL_SONNET, client=sdk)
    client("SYSTEM", "USER")
    kw = sdk.messages.last_kwargs
    assert kw["model"] == MODEL_SONNET
    assert kw["system"] == "SYSTEM"
    assert kw["messages"] == [{"role": "user", "content": "USER"}]
    assert kw["temperature"] == 0.0


def test_model_constants():
    assert MODEL_SONNET == "claude-sonnet-4-6"
    assert MODEL_OPUS == "claude-opus-4-8"


class MockLLM:
    def __init__(self, assignments):
        self.a = assignments
        self.by = {d: sorted(o for o, f in assignments.items() if d in f) for d in DRIVERS}
        self.ids = sorted(assignments)

    def __call__(self, system, user):
        if "You are the coordinator" in system:
            return json.dumps({"attributions": {o: self.a[o][0] for o in self.ids},
                               "narrative": "Impact {{total_cash}} over {{total_orders}}; top {{rank1_driver}} {{rank1_cash}}."})
        d = [x for x in DRIVERS if f"the {x} specialist" in system][0]
        return json.dumps({"domain": d, "pattern": "p",
                           "claims": [{"order_id": o, "stance": "binding", "confidence": "medium",
                                       "reasoning": "m", "cited_signals": {}} for o in self.by[d]]})


def _mock_result():
    batch = generate_batch()
    return run_pipeline(batch, MockLLM(prep_partition(batch).assignments))


def test_cache_round_trip(tmp_path):
    res = _mock_result()
    path = str(tmp_path / "canonical.json")
    saved = save_canonical(res, path, seed=42, n=140)
    loaded = load_canonical(path)
    assert loaded == saved
    assert loaded["seed"] == 42 and loaded["n"] == 140
    assert "AED" in loaded["rendered_brief"]
    assert set(loaded["attributions"].keys()) == set(res.attributions.keys())


def test_cache_captures_three_accuracies_and_lift():
    res = _mock_result()
    d = result_to_dict(res, seed=42, n=140)
    for k in ("overall_accuracy", "clean_accuracy", "ambiguous_accuracy"):
        assert k in d["scorecard"] and k in d["naive"]
    assert set(d["lift"].keys()) == {"overall", "clean", "ambiguous"}


def test_cache_rollup_reconciles():
    res = _mock_result()
    d = result_to_dict(res, seed=42, n=140)
    total = sum(x["cash"] for x in d["rollup"]["by_driver"])
    assert abs(total - d["rollup"]["total_cash"]) < 0.01


def test_cache_meta_defaults_when_unspecified():
    res = _mock_result()
    d = result_to_dict(res, seed=42, n=140)
    meta = d["meta"]
    assert meta["model"] == "unknown"
    assert meta["total_input_tokens"] is None
    assert meta["total_output_tokens"] is None
    # git_sha is either a real 40-char hex commit hash (this repo is a git
    # checkout) or the "unknown" fallback if run outside one
    assert meta["git_sha"] == "unknown" or (len(meta["git_sha"]) == 40 and all(c in "0123456789abcdef" for c in meta["git_sha"]))
    # timestamp round-trips as a real ISO 8601 string
    from datetime import datetime
    datetime.fromisoformat(meta["timestamp"])


def test_cache_meta_captures_model_and_token_usage_when_given():
    res = _mock_result()
    d = result_to_dict(res, seed=42, n=140, model="claude-sonnet-4-6",
                       total_input_tokens=1234, total_output_tokens=567)
    assert d["meta"]["model"] == "claude-sonnet-4-6"
    assert d["meta"]["total_input_tokens"] == 1234
    assert d["meta"]["total_output_tokens"] == 567


def test_cache_meta_survives_json_round_trip(tmp_path):
    res = _mock_result()
    path = str(tmp_path / "canonical.json")
    saved = save_canonical(res, path, seed=42, n=140, model="claude-sonnet-4-6",
                           total_input_tokens=10, total_output_tokens=20)
    loaded = load_canonical(path)
    assert loaded["meta"] == saved["meta"]
    assert loaded["meta"]["model"] == "claude-sonnet-4-6"


@pytest.mark.skipif(not os.getenv("RUN_OTIF_LIVE"), reason="set RUN_OTIF_LIVE=1 to spend credits")
def test_live_smoke_small_batch():
    from otif.graph import run_graph
    batch = generate_batch(n=5)
    res = run_graph(batch, AnthropicClient())
    assert set(res.attributions.keys()) == {lo.order.order_id for lo in batch}
    assert all(v in DRIVERS for v in res.attributions.values())
    assert res.attribution_violations == ()
    assert res.render.ok
