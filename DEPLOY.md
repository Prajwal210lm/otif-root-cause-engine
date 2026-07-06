# Deploy

Two independent pieces: the FastAPI backend (Railway) and the Next.js frontend (Vercel). The
site works with **no backend at all** (it serves the bundled canonical result and hides the
live-run control), so the frontend can go live before the backend does.

## Backend (Railway)

The repo has no Dockerfile; Railway's Nixpacks builder auto-detects Python from
`requirements.txt` and just needs a start command.

**Root directory:** repo root (not `frontend/`).

**Start command:**
```
uvicorn otif.api:app --host 0.0.0.0 --port $PORT
```

**Health check:** `GET /api/health` → `{"status": "ok"}`. Point Railway's health check at this
path.

**Required environment variables** (see [.env.example](.env.example) for the full explanation
of each):

| Variable | Required? | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Only to enable live fresh runs | Everything else (tests, the cached canonical result) works without it. |
| `API_SECRET` | **Required if `ANTHROPIC_API_KEY` is set** | The server fails closed: if a key is present without a secret, `POST /api/analyze?fresh=true` returns `503` and a warning is logged at startup. The two must be set together. |
| `FRONTEND_ORIGIN` | Required in production | Comma-separated exact origin(s), e.g. `https://your-frontend.vercel.app`. Without it, CORS only allows `localhost:3000` and a startup warning is logged. There is no wildcard `*.vercel.app` origin; only origins you name here are trusted. |
| `DAILY_RUN_CAP` | Optional | Default `20`. Hard ceiling on live (paid) runs per UTC day, across all callers, in addition to a per-IP limit of 2 runs/hour that is not configurable via env. |
| `OTIF_CANONICAL` | Optional | Override the path to the committed cache; defaults to `data/canonical_run.json`. |

**What "fail closed" means in practice:** the dangerous state is a live API key with no gate
on who can spend it. That state is refused by default rather than allowed by default. If you
deploy with a key and forget `API_SECRET`, the fresh-run endpoint simply turns itself off
(`503`) instead of quietly becoming an open wallet.

## Frontend (Vercel)

**Root directory:** `frontend` (set this in the Vercel project settings; the repo root is not
a Next.js project).

**Required environment variable:**

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | The Railway backend's public URL, e.g. `https://otif-api.up.railway.app`. If unset, the site still works: it serves the bundled canonical result with zero network calls, and the "Run a fresh analysis" control never appears (there is no `localhost` fallback in production). |
| `API_SECRET` | Must exactly match the backend's `API_SECRET`. Deliberately **not** `NEXT_PUBLIC_`-prefixed: the browser never talks to Railway directly for fresh runs. Instead the browser POSTs to the same-origin `/api/analyze` route (`app/api/analyze/route.js`), which reads this server-side and attaches it as the `x-api-secret` header when forwarding to Railway. If it's missing or wrong, every click of "Run a fresh analysis" fails with a 403 (shown as a distinct, calm error only after that click — never on page load). |

**Manual promote step:** Vercel does not automatically serve the newest commit on the
production domain unless the project is on auto-deploy for the production branch. After a
push, check the Vercel dashboard: if the new deployment sits under "Preview" or shows
"Promote to Production", click it. Do not assume a green build means the public URL updated.

**Build command:** default (`npm run build`, which runs `scripts/sync-canonical.mjs` first to
pull the latest `data/canonical_run.json` into the bundle).

## Post-deploy checklist

Run through this after every deploy, not just the first one:

- [ ] `GET <railway-url>/api/health` returns `{"status":"ok"}`
- [ ] `GET <railway-url>/api/canonical` returns the full JSON (check `scorecard.overall_accuracy` is `0.9857...`)
- [ ] Open the Vercel URL in a **clean incognito window** (no cached state, no dev cookies) and click through all five pages
- [ ] On `/live`, confirm the saved result renders instantly; if `NEXT_PUBLIC_API_URL` is set and the backend is healthy, confirm the "Run a fresh analysis" button appears
- [ ] Verify the OG unfurl: paste the production URL into a WhatsApp or LinkedIn message draft (don't send it) and confirm the headline, the 98.6% stat, and the pipeline image render, not a bare title
- [ ] Confirm `API_SECRET` is set on Railway if `ANTHROPIC_API_KEY` is set (a `503` from a manual `curl -X POST ".../api/analyze?fresh=true"` with no secret header is the expected, correct response, not a bug)
