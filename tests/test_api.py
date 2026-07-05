"""API tests via FastAPI TestClient. health and canonical hit the cache (a temp
fixture written to OTIF_CANONICAL); the fresh path is exercised with a mock LLM
factory injected through dependency_overrides, so no key and no credits. The secret
gate is checked too."""
import json
import os

import pytest
from fastapi.testclient import TestClient

from otif.constants import DRIVERS
from otif.generator import generate_batch
from otif.pipeline import prep_partition
from otif.cache import save_canonical, result_to_dict
from otif.orchestrate import run_pipeline
from otif import api


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


@pytest.fixture
def client(tmp_path, monkeypatch):
    batch = generate_batch(seed=42, n=20)
    res = run_pipeline(batch, MockLLM(prep_partition(batch).assignments))
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


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_canonical_serves_cache(client):
    r = client.get("/api/canonical")
    assert r.status_code == 200
    body = r.json()
    assert "rendered_brief" in body and "scorecard" in body and "rollup" in body
    assert body["n"] == 20


def test_analyze_default_returns_cache(client):
    r = client.post("/api/analyze")
    assert r.status_code == 200
    assert r.json()["n"] == 20


def test_analyze_fresh_runs_pipeline_with_mock(client):
    seed, n = 7, 8
    batch = generate_batch(seed=seed, n=n)
    mock = MockLLM(prep_partition(batch).assignments)
    api.app.dependency_overrides[api.get_llm_factory] = lambda: (lambda: mock)
    try:
        r = client.post(f"/api/analyze?fresh=true&seed={seed}&n={n}")
        assert r.status_code == 200
        body = r.json()
        assert body["seed"] == seed and body["n"] == n
        assert len(body["attributions"]) == n
        assert all(v in DRIVERS for v in body["attributions"].values())
    finally:
        api.app.dependency_overrides.clear()


def test_fresh_requires_secret_when_set(client, monkeypatch):
    monkeypatch.setenv("API_SECRET", "topsecret")
    api.app.dependency_overrides[api.get_llm_factory] = lambda: (lambda: None)
    try:
        r = client.post("/api/analyze?fresh=true&n=5")
        assert r.status_code == 403
    finally:
        api.app.dependency_overrides.clear()


def test_canonical_404_when_missing(monkeypatch):
    monkeypatch.setenv("OTIF_CANONICAL", "/nonexistent/path.json")
    c = TestClient(api.app)
    assert c.get("/api/canonical").status_code == 404
