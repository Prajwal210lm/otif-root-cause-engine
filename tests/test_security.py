"""Security-hardening tests: fail-closed auth for the fresh-run endpoint (a key
without a secret refuses all fresh runs), per-IP rate limiting, the daily run
cap, and the single-run concurrency guard. All state is reset between tests
since the throttles are module-level and shared across the whole app."""
import json

import pytest
from fastapi.testclient import TestClient

from otif.constants import DRIVERS
from otif.generator import generate_batch
from otif.pipeline import prep_partition
from otif import api


class MockLLM:
    def __init__(self, assignments):
        self.a = assignments
        self.by = {d: sorted(o for o, f in assignments.items() if d in f) for d in DRIVERS}
        self.ids = sorted(assignments)

    def __call__(self, system, user):
        if "You are the coordinator" in system:
            return json.dumps({"attributions": {o: self.a[o][0] for o in self.ids},
                               "narrative": "Impact {{total_cash}} over {{total_orders}}."})
        d = [x for x in DRIVERS if f"the {x} specialist" in system][0]
        return json.dumps({"domain": d, "pattern": "p",
                           "claims": [{"order_id": o, "stance": "binding", "confidence": "medium",
                                       "reasoning": "m", "cited_signals": {}} for o in self.by[d]]})


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    # hermetic against the host shell's own ANTHROPIC_API_KEY / API_SECRET, and
    # against throttle state left over from a previous test
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("API_SECRET", raising=False)
    monkeypatch.delenv("FRONTEND_ORIGIN", raising=False)
    monkeypatch.delenv("DAILY_RUN_CAP", raising=False)
    api._daily["date"] = None
    api._daily["count"] = 0
    api._ip_hits.clear()
    yield
    api.app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(api.app)


def _mock_for(seed, n):
    batch = generate_batch(seed=seed, n=n)
    return MockLLM(prep_partition(batch).assignments)


def _install_mock(seed, n):
    api.app.dependency_overrides[api.get_llm_factory] = lambda: (lambda: _mock_for(seed, n))


# --- fail-closed --------------------------------------------------------------

def test_fresh_disabled_when_key_set_without_secret(client, monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-fake-for-test")
    r = client.post("/api/analyze?fresh=true&n=5")
    assert r.status_code == 503
    assert "API_SECRET" in r.json()["detail"]


def test_fail_closed_guard_runs_before_the_secret_check(client, monkeypatch):
    # in this misconfigured state, no secret is "correct", so even a header
    # that would otherwise pass must not bypass the 503
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-fake-for-test")
    r = client.post("/api/analyze?fresh=true&n=5", headers={"x-api-secret": "anything"})
    assert r.status_code == 503


def test_fresh_allowed_when_key_and_secret_are_both_set(client, monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-fake-for-test")
    monkeypatch.setenv("API_SECRET", "s3cret")
    _install_mock(7, 5)
    r = client.post("/api/analyze?fresh=true&seed=7&n=5", headers={"x-api-secret": "s3cret"})
    assert r.status_code == 200


# --- server-side throttling ----------------------------------------------------

def test_per_ip_rate_limit_blocks_after_the_hourly_max(client):
    for _ in range(api.RATE_LIMIT_PER_IP_PER_HOUR):
        _install_mock(7, 5)
        r = client.post("/api/analyze?fresh=true&seed=7&n=5")
        assert r.status_code == 200
    _install_mock(7, 5)
    r = client.post("/api/analyze?fresh=true&seed=7&n=5")
    assert r.status_code == 429
    assert r.json()["error"] == "rate_limited"


def test_daily_cap_blocks_runs_once_reached(client, monkeypatch):
    monkeypatch.setenv("DAILY_RUN_CAP", "1")
    _install_mock(7, 5)
    r1 = client.post("/api/analyze?fresh=true&seed=7&n=5")
    assert r1.status_code == 200
    _install_mock(7, 5)
    r2 = client.post("/api/analyze?fresh=true&seed=7&n=5")
    assert r2.status_code == 429
    assert r2.json()["error"] == "rate_limited"


def test_concurrent_run_rejected_while_one_is_in_flight(client):
    assert api._run_semaphore.acquire(blocking=False)
    try:
        r = client.post("/api/analyze?fresh=true&n=5")
        assert r.status_code == 429
        assert r.json()["error"] == "run_in_progress"
    finally:
        api._run_semaphore.release()


def test_semaphore_is_released_after_a_run_so_the_next_one_succeeds(client):
    _install_mock(7, 5)
    r1 = client.post("/api/analyze?fresh=true&seed=7&n=5")
    assert r1.status_code == 200
    assert api._run_semaphore.acquire(blocking=False)  # not left held
    api._run_semaphore.release()
