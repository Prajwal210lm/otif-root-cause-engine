"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";
import { METRICS } from "../lib/otif";

export default function CaseStudy() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotionSafe();

  const Details = (
    <div className="mt-5 grid gap-4 border-t border-hairline pt-5 sm:grid-cols-2">
      <div className="rounded-lg border border-hairline bg-canvas p-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#C0552F" }} />
          <span className="text-sm font-semibold text-ink">Supplier</span>
          <span className="tnum ml-auto text-sm text-ink">10 days late</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#6E5B96" }} />
          <span className="text-sm font-semibold text-ink">Warehouse</span>
          <span className="tnum ml-auto text-sm text-ink">2 days slow</span>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="rounded-lg border border-hairline bg-canvas p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Simple rule</p>
          <p className="mt-1 text-sm text-ink">
            Picks the largest single signal → blames <span className="font-semibold" style={{ color: "#6E5B96" }}>warehouse</span>.
            <span className="font-semibold text-ink"> Wrong.</span>
          </p>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Coordinator</p>
          <p className="mt-1 text-sm text-ink">
            Reasons the late PO alone would have closed the shortfall → blames <span className="font-semibold" style={{ color: "#C0552F" }}>supplier</span>.
            <span className="font-semibold text-accent"> Correct.</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-hairline bg-surface p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Worked example · one of {METRICS.winsOverNaive} wins</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">
            Order OTIF-0011: the bigger signal isn&rsquo;t the cause.
          </h3>
          <p className="mt-2 max-w-[380px] text-sm leading-relaxed text-muted">
            Supplier ran 10 days late; the warehouse was 2 days slow. Which one actually broke the order?
          </p>
        </div>
        <span aria-hidden className="tnum shrink-0 rounded-md border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          ambiguous
        </span>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-hairline bg-canvas px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-ink/30"
      >
        {open ? "Hide the reasoning" : "See how each method decided"}
        <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>↓</span>
      </button>

      {open &&
        (reduce ? (
          Details
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {Details}
          </motion.div>
        ))}
    </div>
  );
}
