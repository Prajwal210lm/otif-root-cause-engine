"use client";

import { useEffect, useRef, useState } from "react";
import { DRIVERS, fmtAED } from "../lib/otif";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";
import canonical from "../lib/canonicalRun.json";

// Time-scripted stages for the ~30s fresh-run wait. Not real progress signals,
// just honest pacing so one static status line doesn't read as a hang. If the
// real result arrives before the last stage, the caller simply stops rendering
// this component, so it naturally "skips ahead" rather than finishing itself.
const RUN_STAGES = [
  { at: 0, label: "Partitioning orders…", agent: null },
  { at: 3, label: "Demand agent investigating…", agent: "demand" },
  { at: 7, label: "Supplier agent investigating…", agent: "supplier" },
  { at: 11, label: "Warehouse agent investigating…", agent: "warehouse" },
  { at: 15, label: "Logistics agent investigating…", agent: "logistics" },
  { at: 20, label: "Coordinator adjudicating…", agent: null },
  { at: 25, label: "Ranking by value…", agent: null },
];

function FreshRunProgress() {
  const reduce = useReducedMotionSafe();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 200);
    return () => clearInterval(id);
  }, []);

  let stage = RUN_STAGES[0];
  for (const s of RUN_STAGES) if (elapsed >= s.at) stage = s;

  return (
    <div className="border-b border-hairline bg-canvas px-5 py-3 md:px-7">
      <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        <span className="flex items-center gap-1.5">
          {reduce ? (
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          ) : (
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
          )}
          <span className="text-accent">live</span>
        </span>
        {["demand", "supplier", "warehouse", "logistics"].map((k) => {
          const isCurrent = stage.agent === k;
          return (
            <span key={k} className="flex items-center gap-1.5" style={{ opacity: isCurrent ? 1 : 0.35 }}>
              <span
                className={`h-1.5 w-1.5 rounded-full ${isCurrent && !reduce ? "motion-safe:animate-pulse" : ""}`}
                style={{ backgroundColor: DRIVERS[k].color }}
              />
              <span className={isCurrent ? "text-ink" : ""}>{k}</span>
            </span>
          );
        })}
        <span className="text-ink" aria-live="polite">{stage.label}</span>
      </div>
    </div>
  );
}

// No default: if the env isn't set (e.g. a deploy without a backend) we never
// fire stray requests and the live-run control simply doesn't appear.
const API = process.env.NEXT_PUBLIC_API_URL || "";
const FRESH_TIMEOUT_MS = 90_000;

function normalize(json) {
  const limits = (json.rendered_brief?.split("WHAT COULD NOT BE ESTABLISHED")[1] || "").trim();
  return {
    overall: json.scorecard.overall_accuracy,
    clean: json.scorecard.clean_accuracy,
    ambiguous: json.scorecard.ambiguous_accuracy, // null when the batch had no hard orders
    naiveAmbiguous: json.naive.ambiguous_accuracy,
    liftAmbiguous: json.lift.ambiguous,
    nAmbiguous: json.scorecard.n_ambiguous,
    ambiguousCorrect: json.scorecard.ambiguous_correct,
    totalValue: json.rollup.total_cash,
    drivers: json.rollup.by_driver.map((x) => ({
      key: x.driver, cash: x.cash, share: x.cash_share, orders: x.order_count,
    })),
    limits:
      limits ||
      "These figures are order value at risk, not confirmed revenue loss. Pinning the cause down further inside each team needs source-system logs the synthetic batch does not include.",
    n: json.n,
    seed: json.seed ?? 42,
  };
}

// Default result is bundled at build time: renders instantly, no backend needed.
const DEFAULT = normalize(canonical);

// null-safe percentage: small fresh batches can legitimately have no hard
// orders, which must read as "n/a", never as 0.0%.
const pct = (x) => (x == null ? null : (x * 100).toFixed(1) + "%");

const ERROR_COPY = {
  timeout: "The live run timed out after 90 seconds. Showing the saved result.",
  model: "The model returned an invalid result on this run. Showing the saved result.",
  withheld: "The run was withheld by a validation check. Showing the saved result.",
  auth: "The live run isn't configured correctly on this deployment. Showing the saved result.",
  network: "Couldn't reach the live model. Showing the saved result.",
};

export default function LiveConsole() {
  const [data, setData] = useState(DEFAULT);
  const [source, setSource] = useState("saved"); // saved | fresh
  const [backendUp, setBackendUp] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | running
  const [errKind, setErrKind] = useState(null); // keyof ERROR_COPY | null
  const [usedFresh, setUsedFresh] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setUsedFresh(localStorage.getItem("otif_fresh_used") === "1");
    if (!API) return; // no backend configured: cached result only, no probes
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    fetch(`${API}/api/health`, { signal: ctrl.signal })
      .then((r) => { if (r.ok && mounted.current) setBackendUp(true); })
      .catch(() => {})
      .finally(() => clearTimeout(t));
    return () => { mounted.current = false; ctrl.abort(); };
  }, []);

  async function runFresh() {
    if (usedFresh || status === "running") return;
    setStatus("running");
    setErrKind(null);
    const seed = 1000 + Math.floor(Math.random() * 8000);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FRESH_TIMEOUT_MS);
    try {
      const r = await fetch(`/api/analyze?seed=${seed}&n=12`, {
        method: "POST",
        signal: ctrl.signal,
      });
      if (!mounted.current) return;
      if (r.status === 502) {
        setErrKind("model");
        return;
      }
      if (r.status === 403) {
        setErrKind("auth");
        return;
      }
      if (!r.ok) {
        setErrKind("network");
        return;
      }
      const json = await r.json();
      if (json.attribution_violations?.length || json.render_ok === false) {
        setErrKind("withheld");
        return;
      }
      setData(normalize(json));
      setSource("fresh");
      localStorage.setItem("otif_fresh_used", "1");
      setUsedFresh(true);
    } catch (e) {
      if (mounted.current) setErrKind(e?.name === "AbortError" ? "timeout" : "network");
    } finally {
      clearTimeout(timer);
      if (mounted.current) setStatus("idle");
    }
  }

  const noHardOrders = data.nAmbiguous === 0;

  return (
    <section id="console" className="mx-auto max-w-[1120px] px-6 pt-8 pb-20">
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
        {/* control bar */}
        <div className="flex flex-col gap-4 border-b border-hairline px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${source === "fresh" ? "bg-accent text-white" : "border border-hairline text-muted"}`}>
              {source === "fresh" ? "fresh run" : "saved result · standard batch"}
            </span>
            <span className="tnum font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              seed {data.seed} · n={data.n}
            </span>
          </div>

          {backendUp && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {errKind && <span className="text-xs text-muted">{ERROR_COPY[errKind]}</span>}
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">Takes about 30 seconds · new random batch</span>
              <button
                onClick={runFresh}
                disabled={usedFresh || status === "running"}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {status === "running" ? "Running…" : usedFresh ? "Fresh run used" : "Run a fresh analysis"}
              </button>
            </div>
          )}
        </div>

        {status === "running" && <FreshRunProgress />}

        {/* result body */}
        <div className="grid gap-px bg-hairline md:grid-cols-2">
          <div className="bg-surface p-5 md:p-7">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Which team, by money</p>
              <span className="tnum text-sm font-semibold text-ink">{fmtAED(data.totalValue)}</span>
            </div>
            <ul className="mt-5 space-y-4">
              {data.drivers.map((d) => {
                const meta = DRIVERS[d.key];
                return (
                  <li key={d.key}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-ink">
                        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: meta.color }} />
                        {meta.label}
                      </span>
                      <span className="tnum text-ink">{fmtAED(d.cash)} · {(d.share * 100).toFixed(1)}%</span>
                    </div>
                    <div aria-hidden="true" className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                      <div className="h-full rounded-full" style={{ width: `${d.share * 100}%`, backgroundColor: meta.color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-surface p-5 md:p-7">
            <p className="eyebrow">How often it was right</p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              <Metric label="Overall" value={pct(data.overall) ?? "n/a"} accent />
              <Metric label="Easy orders" value={pct(data.clean) ?? "n/a"} />
              <Metric label="Hard orders" value={pct(data.ambiguous) ?? "n/a"} />
            </div>
            <div className="mt-6 space-y-3 border-t border-hairline pt-5 text-sm">
              {noHardOrders ? (
                <p className="text-muted">
                  This batch had no hard (two-cause) orders, so there is no hard-order score to report.
                </p>
              ) : (
                <>
                  <Row label="Simple 'biggest number' rule" value={pct(data.naiveAmbiguous) ?? "n/a"} muted />
                  <Row
                    label="Accuracy the agents add"
                    value={data.liftAmbiguous == null ? "n/a" : `+${(data.liftAmbiguous * 100).toFixed(1)} pts`}
                    accent
                  />
                  <Row label="Hard orders resolved" value={`${data.ambiguousCorrect}/${data.nAmbiguous}`} />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-hairline bg-canvas px-5 py-5 md:px-7">
          <p className="eyebrow">What the engine says it could not establish</p>
          <ul className="mt-3 max-w-[860px] space-y-2">
            {data.limits.split(/(?<=\.)\s+(?=[A-Z])/).map((sentence, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                <span aria-hidden className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-muted/60" />
                <span>{sentence}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div>
      <div className={`tnum text-xl font-bold leading-none md:text-2xl ${accent ? "text-accent" : "text-ink"}`}>{value}</div>
      <div className="eyebrow mt-2">{label}</div>
    </div>
  );
}

function Row({ label, value, muted, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`tnum font-semibold ${accent ? "text-accent" : muted ? "text-muted" : "text-ink"}`}>{value}</span>
    </div>
  );
}
