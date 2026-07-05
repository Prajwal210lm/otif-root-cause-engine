"""Hardening-pass tests: coordinator parse retry, attribution-violation
enforcement (brief withheld), cited-signals verification, adversarial
extract_json cases, the correct-secret API path, structured 502 on model
failure, ETag/Cache-Control on the canonical endpoint, and null-accuracy
propagation for batches with no ambiguous orders."""
import json

import pytest
from fastapi.testclient import TestClient

from otif.constants import DRIVERS
from otif.generator import generate_batch
from otif.pipeline import prep_partition
from otif.specialists import parse_specialist_report
from otif.orchestrate import extract_json, run_coordinator, run_pipeline
from otif.cache import save_canonical, result_to_dict
from otif import api


class SeqLLM:
    """Returns queued responses, repeating the last one when exhausted."""

    def __init__(self, seq):
        self.seq = list(seq)
        self.calls = 0

    def __call__(self, system, user):
        self.calls += 1
        return self.seq[min(self.calls - 1, len(self.seq) - 1)]


class ScriptedMockLLM:
    """Schema-valid specialists; coordinator behavior scripted per call:
    'ok' attributes each order to its first fired driver, 'violate' attributes
    every order to a driver whose signal did NOT fire, 'garbage' returns
    unparseable text."""

    def __init__(self, assignments, coord_modes=("ok",)):
        self.a = assignments
        self.by = {d: sorted(o for o, f in assignments.items() if d in f) for d in DRIVERS}
        self.ids = sorted(assignments)
        self.coord_modes = list(coord_modes)
        self.coord_calls = 0

    def _attributions(self, mode):
        if mode == "ok":
            return {o: self.a[o][0] for o in self.ids}
        return {o: next(d for d in DRIVERS if d not in set(self.a[o])) for o in self.ids}

    def __call__(self, system, user):
        if "You are the coordinator" in system:
            mode = self.coord_modes[min(self.coord_calls, len(self.coord_modes) - 1)]
            self.coord_calls += 1
            if mode == "garbage":
                return "definitely not json"
            return json.dumps({
                "attributions": self._attributions(mode),
                "narrative": "Top driver {{rank1_driver}} at {{rank1_cash}}.",
            })
        d = next(x for x in DRIVERS if f"the {x} specialist" in system)
        claims = [{"order_id": o, "stance": "binding", "confidence": "medium",
                   "reasoning": "m", "cited_signals": {}} for o in self.by[d]]
        return json.dumps({"domain": d, "pattern": "p", "claims": claims})


_VALID_COORD = json.dumps({
    "attributions": {"A": "supplier"},
    "narrative": "Top driver {{rank1_driver}}.",
})


# --- coordinator parse retry -------------------------------------------------

def test_coordinator_parse_retry_recovers():
    llm = SeqLLM(["*** not json ***", _VALID_COORD])
    out = run_coordinator([], {}, {"A"}, llm)
    assert out.attributions == {"A": "supplier"}
    assert llm.calls == 2


def test_coordinator_parse_retry_exhausts_and_raises():
    llm = SeqLLM(["*** not json ***"])
    with pytest.raises(ValueError):
        run_coordinator([], {}, {"A"}, llm)
    assert llm.calls == 2  # one attempt + one parse retry, then raise


# --- attribution-violation enforcement ---------------------------------------

def test_violation_retry_corrects_and_renders():
    batch = generate_batch(seed=42, n=12)
    mock = ScriptedMockLLM(prep_partition(batch).assignments, coord_modes=("violate", "ok"))
    res = run_pipeline(batch, mock)
    assert mock.coord_calls == 2  # re-prompted once with the violations quoted
    assert res.attribution_violations == ()
    assert res.render.ok


def test_persistent_violations_withhold_brief():
    batch = generate_batch(seed=42, n=12)
    mock = ScriptedMockLLM(prep_partition(batch).assignments, coord_modes=("violate", "violate"))
    res = run_pipeline(batch, mock)
    assert res.attribution_violations != ()
    assert not res.render.ok
    assert res.render.rendered is None
    assert any("attribution violation" in v for v in res.render.violations)


# --- cited-signals verification ----------------------------------------------

def _claim_raw(cited):
    return {
        "domain": "supplier",
        "pattern": "p",
        "claims": [{"order_id": "X1", "stance": "binding", "confidence": "high",
                    "reasoning": "r", "cited_signals": cited}],
    }


_EVIDENCE = {"X1": {"po_qty": 65, "shortfall_units": 60, "supplier_late_days": 4,
                    "forecast_error_pct": 0.346711259754738}}


def test_cited_signals_matching_passes():
    rep = parse_specialist_report(
        _claim_raw({"po_qty": 65, "supplier_late_days": 4}), "supplier", {"X1"},
        evidence_by_id=_EVIDENCE,
    )
    assert rep.claims[0].cited_signals == {"po_qty": 65, "supplier_late_days": 4}


def test_cited_signals_honest_rounding_passes():
    # the real bug this guards against: a specialist citing 0.347 in prose for
    # the true 0.346711259754738 (a ~0.08% difference) was being rejected as
    # if it were fabricated, when it is just readable rounding
    rep = parse_specialist_report(
        _claim_raw({"forecast_error_pct": 0.347}), "supplier", {"X1"},
        evidence_by_id=_EVIDENCE,
    )
    assert rep.claims[0].cited_signals == {"forecast_error_pct": 0.347}


def test_cited_signals_beyond_tolerance_still_rejected():
    # 0.36 against a true 0.346711259754738 is a ~3.7% difference: well past
    # the 2% rounding allowance, so this must still be treated as a mismatch
    with pytest.raises(ValueError, match="actual value"):
        parse_specialist_report(
            _claim_raw({"forecast_error_pct": 0.36}), "supplier", {"X1"},
            evidence_by_id=_EVIDENCE,
        )


def test_cited_signals_unknown_key_rejected():
    with pytest.raises(ValueError, match="does not exist"):
        parse_specialist_report(
            _claim_raw({"invented_signal": 1}), "supplier", {"X1"},
            evidence_by_id=_EVIDENCE,
        )


def test_cited_signals_wrong_value_rejected():
    with pytest.raises(ValueError, match="actual value"):
        parse_specialist_report(
            _claim_raw({"po_qty": 999}), "supplier", {"X1"},
            evidence_by_id=_EVIDENCE,
        )


def test_cited_signals_skipped_without_evidence():
    rep = parse_specialist_report(_claim_raw({"po_qty": 999}), "supplier", {"X1"})
    assert rep.claims[0].cited_signals == {"po_qty": 999}


# --- adversarial extract_json -------------------------------------------------

def test_extract_json_nested_object_with_prose():
    assert extract_json('Result: {"a": {"b": 2}} thanks') == {"a": {"b": 2}}


def test_extract_json_two_objects_raises():
    with pytest.raises(ValueError):
        extract_json('{"a": 1} and also {"b": 2}')


# --- API: correct secret, structured 502, ETag --------------------------------

@pytest.fixture
def api_client(tmp_path, monkeypatch):
    batch = generate_batch(seed=42, n=20)
    mock = ScriptedMockLLM(prep_partition(batch).assignments)
    res = run_pipeline(batch, mock)
    path = str(tmp_path / "canonical.json")
    save_canonical(res, path, seed=42, n=20)
    monkeypatch.setenv("OTIF_CANONICAL", path)
    # hermetic against the host shell's own ANTHROPIC_API_KEY (e.g. set locally
    # for scripts/run_canonical.py): the fail-closed guard must not fire here
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("API_SECRET", raising=False)
    api._daily["date"] = None  # reset the in-process rate limiter between tests
    api._ip_hits.clear()
    return TestClient(api.app)


def test_analyze_with_correct_secret_runs_fresh(api_client, monkeypatch):
    monkeypatch.setenv("API_SECRET", "s3cret")
    seed, n = 7, 8
    batch = generate_batch(seed=seed, n=n)
    mock = ScriptedMockLLM(prep_partition(batch).assignments)
    api.app.dependency_overrides[api.get_llm_factory] = lambda: (lambda: mock)
    try:
        r = api_client.post(f"/api/analyze?fresh=true&seed={seed}&n={n}",
                            headers={"x-api-secret": "s3cret"})
        assert r.status_code == 200
        body = r.json()
        assert body["seed"] == seed and body["n"] == n
        assert len(body["attributions"]) == n
    finally:
        api.app.dependency_overrides.clear()


def test_analyze_model_failure_returns_structured_502(api_client, monkeypatch):
    monkeypatch.delenv("API_SECRET", raising=False)
    api.app.dependency_overrides[api.get_llm_factory] = (
        lambda: (lambda: (lambda system, user: "*** not json ***"))
    )
    try:
        r = api_client.post("/api/analyze?fresh=true&seed=7&n=5")
        assert r.status_code == 502
        body = r.json()
        assert body["error"] == "model_output_invalid"
        assert body["detail"]
    finally:
        api.app.dependency_overrides.clear()


def test_canonical_sends_etag_and_supports_304(api_client):
    r1 = api_client.get("/api/canonical")
    assert r1.status_code == 200
    etag = r1.headers.get("etag")
    assert etag
    assert "max-age" in r1.headers.get("cache-control", "")
    r2 = api_client.get("/api/canonical", headers={"If-None-Match": etag})
    assert r2.status_code == 304


# --- null ambiguous slice propagates as null, not zero -------------------------

def test_no_ambiguous_batch_propagates_null_accuracy():
    clean_only = [lo for lo in generate_batch() if not lo.planted_is_ambiguous][:8]
    mock = ScriptedMockLLM(prep_partition(clean_only).assignments)
    res = run_pipeline(clean_only, mock)
    assert res.scorecard.n_ambiguous == 0
    assert res.scorecard.ambiguous_accuracy is None
    d = result_to_dict(res, seed=42, n=8)
    assert d["scorecard"]["ambiguous_accuracy"] is None
    assert d["lift"]["ambiguous"] is None
    json.dumps(d)  # must remain JSON-serializable with nulls
