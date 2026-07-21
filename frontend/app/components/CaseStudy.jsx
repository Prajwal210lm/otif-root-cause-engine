"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";
import { CANONICAL, DRIVERS, METRICS } from "../lib/otif";

// Worked example for order OTIF-0011. The correct cause is read from the canonical
// answer key (warehouse) so it can never drift from the data; the signal
// magnitudes are illustrative. Two teams fired: the naive largest-signal rule is
// drawn to the louder supplier lateness and misses; the coordinator sees that
// stock was on hand and correctly binds warehouse.
const ORDER_ID = "OTIF-0011";

export default function CaseStudy() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotionSafe();
  const truth = CANONICAL.attributions[ORDER_ID]; // warehouse
  const truthMeta = DRIVERS[truth];

  const Details = (
    <div className="mt-5 grid gap-4 border-t border-hairline pt-5 sm:grid-cols-2">
      <div className="rounded-lg border border-hairline bg-raised p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Two teams fired</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DRIVERS.supplier.color }} />
          <span className="text-sm font-semibold text-ink">Supplier</span>
          <span className="tnum ml-auto text-sm text-muted">PO 6 days late</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DRIVERS.warehouse.color }} />
          <span className="text-sm font-semibold text-ink">Warehouse</span>
          <span className="tnum ml-auto text-sm text-muted">2 days slow</span>
        </div>
        <p className="mt-3 border-t border-hairline pt-3 text-xs leading-relaxed text-muted">
          Stock was physically on hand, so the late PO did not starve the pick.
        </p>
      </div>
      <div className="grid gap-3">
        <div className="rounded-lg border border-hairline bg-raised p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Simple rule</p>
          <p className="mt-1 text-sm text-ink">
            Picks the loudest single signal, the supplier lateness, and blames{" "}
            <span className="font-semibold" style={{ color: DRIVERS.supplier.color }}>supplier</span>.
            <span className="font-semibold text-ink"> Wrong.</span>
          </p>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent-tint p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Coordinator</p>
          <p className="mt-1 text-sm text-ink">
            Stock was on hand, so execution bound the outcome. Blames{" "}
            <span className="font-semibold" style={{ color: truthMeta.color }}>{truth}</span>.
            <span className="font-semibold text-accent"> Correct.</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reg h-full rounded-xl border border-hairline bg-surface p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-faint">
            Worked example · one of {METRICS.winsOverNaive} wins
          </p>
          <h3 className="mt-2 text-lg font-semibold text-ink">
            Order {ORDER_ID}: the louder signal is not the cause.
          </h3>
          <p className="mt-2 max-w-[380px] text-sm leading-relaxed text-muted">
            Supplier ran late and the warehouse was slow. Which one actually broke the order, and does
            the coordinator agree with the answer key?
          </p>
        </div>
        <span aria-hidden className="tnum shrink-0 rounded-md border border-hairline-strong px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          ambiguous
        </span>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-hairline-strong bg-raised px-3.5 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
      >
        {open ? "Hide the reasoning" : "See how each method decided"}
        <span aria-hidden className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>↓</span>
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
