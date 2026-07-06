// Proxies the fresh-run request to the backend, attaching the shared secret
// server-side. API_SECRET must never be a NEXT_PUBLIC_ variable: this route
// exists specifically so the browser never sees it.
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "";
const SECRET = process.env.API_SECRET || "";
const TIMEOUT_MS = 90_000;

export async function POST(request) {
  if (!BACKEND) {
    return Response.json({ detail: "backend not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const seed = searchParams.get("seed") ?? "42";
  const n = searchParams.get("n") ?? "12";

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${BACKEND}/api/analyze?fresh=true&seed=${seed}&n=${n}`, {
      method: "POST",
      headers: { "x-api-secret": SECRET },
      signal: ctrl.signal,
    });
    const body = await r.json().catch(() => ({ detail: "invalid response from backend" }));
    return Response.json(body, { status: r.status });
  } catch (e) {
    const status = e?.name === "AbortError" ? 504 : 503;
    return Response.json({ detail: "could not reach backend" }, { status });
  } finally {
    clearTimeout(timer);
  }
}
