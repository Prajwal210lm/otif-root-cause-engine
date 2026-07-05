"""FastAPI surface over the OTIF engine. Three endpoints: health, canonical (serves
the committed cache, keyless and instant), and analyze (cached by default; ?fresh
runs the live multi-agent graph, gated by a required secret, server-side
throttles, and a fail-closed startup check). The LLM client is injected via a
factory dependency so the cached paths never construct a client and the fresh
path is testable with a mock at zero credit."""
import hashlib
import logging
import os
import threading
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Depends, Header, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from otif.generator import generate_batch
from otif.graph import run_graph
from otif.cache import load_canonical, result_to_dict

logger = logging.getLogger("otif.api")

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RATE_LIMIT_PER_IP_PER_HOUR = 2
RATE_LIMIT_WINDOW_SECONDS = 3600


def _canonical_path() -> str:
    return os.environ.get("OTIF_CANONICAL", os.path.join(_ROOT, "data", "canonical_run.json"))


def _daily_cap() -> int:
    return int(os.environ.get("DAILY_RUN_CAP", "20"))


def get_llm_factory():
    """Returns a zero-arg factory that builds the real client. Resolved on every
    request but only CALLED on the fresh path, so serving the cache needs no key.
    Tests override this dependency to return a mock factory."""
    def make():
        from otif.client import AnthropicClient
        return AnthropicClient()
    return make


# --- fail-closed configuration guard ----------------------------------------
# The dangerous combination is a live API key with no secret gating who can
# spend it. That combination is refused by default, not allowed by default.

def _fresh_disabled_reason() -> str | None:
    if os.environ.get("ANTHROPIC_API_KEY") and not os.environ.get("API_SECRET"):
        return (
            "Fresh runs are disabled: ANTHROPIC_API_KEY is set but API_SECRET is not. "
            "Set API_SECRET in the environment to enable POST /api/analyze?fresh=true."
        )
    return None


@asynccontextmanager
async def _lifespan(app: FastAPI):
    reason = _fresh_disabled_reason()
    if reason:
        logger.warning(reason)
    if not os.environ.get("FRONTEND_ORIGIN"):
        logger.warning(
            "FRONTEND_ORIGIN is not set; only localhost origins are allowed by CORS. "
            "Set FRONTEND_ORIGIN to your deployed frontend URL in production."
        )
    yield


app = FastAPI(title="OTIF Root-Cause Engine", lifespan=_lifespan)

# Exact origins only: localhost for dev, plus whatever FRONTEND_ORIGIN names.
# No wildcard subdomain regex; an unset FRONTEND_ORIGIN means no non-local
# browser can call this API (the warning above says so at startup).
_origins = [o.strip() for o in os.environ.get("FRONTEND_ORIGIN", "").split(",") if o.strip()] + [
    "http://localhost:3000", "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --- server-side throttling ---------------------------------------------------
# In-memory: correct for a single-instance deployment (this project's scale),
# not for multiple replicas. Concurrency is capped process-wide at one live run
# so a burst of requests cannot fan out into parallel paid calls.

_state_lock = threading.Lock()
_ip_hits: dict = defaultdict(list)
_daily = {"date": None, "count": 0}
_run_semaphore = threading.Semaphore(1)


def _reserve_run_slot(ip: str) -> str | None:
    """Atomically checks the daily cap and the per-IP rate limit and, if both
    pass, books the attempt. Returns an error message if the request should be
    rejected, else None. Booking and checking happen under one lock so
    concurrent requests cannot race past either limit."""
    now = time.time()
    today = datetime.now(timezone.utc).date().isoformat()
    with _state_lock:
        if _daily["date"] != today:
            _daily["date"] = today
            _daily["count"] = 0
        cap = _daily_cap()
        if _daily["count"] >= cap:
            return f"Daily limit of {cap} live runs reached. Try again tomorrow."
        hits = [t for t in _ip_hits[ip] if now - t < RATE_LIMIT_WINDOW_SECONDS]
        if len(hits) >= RATE_LIMIT_PER_IP_PER_HOUR:
            return f"Rate limit: max {RATE_LIMIT_PER_IP_PER_HOUR} live runs per hour per IP."
        hits.append(now)
        _ip_hits[ip] = hits
        _daily["count"] += 1
        return None


@app.get("/api/health")
def health():
    return {"status": "ok"}


def _canonical_payload():
    path = _canonical_path()
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="canonical run not found")
    return load_canonical(path)


@app.get("/api/canonical")
def canonical(request: Request):
    payload = _canonical_payload()
    etag = '"' + hashlib.md5(repr(sorted(payload.items())).encode()).hexdigest() + '"'
    headers = {"ETag": etag, "Cache-Control": "public, max-age=300"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    return JSONResponse(content=payload, headers=headers)


@app.post("/api/analyze")
def analyze(
    request: Request,
    fresh: bool = Query(False),
    seed: int = Query(42),
    n: int = Query(140, ge=1, le=140),
    make_llm=Depends(get_llm_factory),
    x_api_secret: str = Header(None),
):
    if not fresh:
        return _canonical_payload()

    disabled = _fresh_disabled_reason()
    if disabled:
        raise HTTPException(status_code=503, detail=disabled)

    secret = os.environ.get("API_SECRET")
    if secret and x_api_secret != secret:
        raise HTTPException(status_code=403, detail="fresh run requires a valid x-api-secret")

    ip = request.client.host if request.client else "unknown"

    if not _run_semaphore.acquire(blocking=False):
        return JSONResponse(
            status_code=429,
            content={"error": "run_in_progress", "detail": "Another live run is already in progress. Try again shortly."},
        )
    try:
        limit_msg = _reserve_run_slot(ip)
        if limit_msg:
            return JSONResponse(status_code=429, content={"error": "rate_limited", "detail": limit_msg})

        ts = datetime.now(timezone.utc).isoformat()
        logger.info("fresh_run start ts=%s ip=%s seed=%s n=%s", ts, ip, seed, n)

        batch = generate_batch(seed=seed, n=n)
        llm = make_llm()
        try:
            result = run_graph(batch, llm)
        except (ValueError, RuntimeError) as e:
            logger.info(
                "fresh_run failed ts=%s ip=%s seed=%s n=%s error=%s",
                ts, ip, seed, n, e,
            )
            # the model produced output the contracts rejected (or was truncated);
            # a structured 502 lets the frontend say what actually happened
            return JSONResponse(
                status_code=502,
                content={"error": "model_output_invalid", "detail": str(e)},
            )

        tokens_in = getattr(llm, "total_input_tokens", None)
        tokens_out = getattr(llm, "total_output_tokens", None)
        logger.info(
            "fresh_run done ts=%s ip=%s seed=%s n=%s tokens_in=%s tokens_out=%s",
            ts, ip, seed, n, tokens_in, tokens_out,
        )
        return result_to_dict(
            result, seed=seed, n=n,
            model=getattr(llm, "model", "unknown"),
            total_input_tokens=tokens_in,
            total_output_tokens=tokens_out,
        )
    finally:
        _run_semaphore.release()
