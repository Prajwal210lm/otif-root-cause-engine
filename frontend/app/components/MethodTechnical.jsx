"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";
import { METRICS } from "../lib/otif";

const GUARANTEES = [
  {
    tag: "The firewall",
    body: "Each agent sees only the raw signals for its own team on one order. It never sees the planted answer, so the accuracy it earns is real, not leaked.",
  },
  {
    tag: "Tested computation",
    body: `Every figure (shortfall, cost, accuracy) is produced by deterministic code under ${METRICS.tests} passing tests. The model reasons about cause; it never does the arithmetic.`,
  },
  {
    tag: "The render gate",
    body: "The final brief can only print numbers through a template bound to audited values. Any figure the model tries to write itself is rejected before it reaches the page.",
  },
];

export default function MethodTechnical() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotionSafe();

  const panel = (
    <div className="mt-6 space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-ink">The three levels of responsibility</h4>
        <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-muted">
          In the code, each agent files one of three verdicts for its team:{" "}
          <span className="font-medium text-ink">binding</span> (the deciding cause),{" "}
          <span className="font-medium text-ink">contributing</span> (a smaller factor that made it
          worse), or <span className="font-medium text-ink">incidental</span> (its signal fired, but it
          was not the story). The coordinator&rsquo;s job is to pick the single binding cause when more
          than one team fired.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {GUARANTEES.map((g) => (
          <div key={g.tag} className="rounded-lg border border-hairline bg-surface p-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">{g.tag}</h4>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{g.body}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-10 rounded-xl border border-hairline bg-canvas p-6 md:p-8">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span>
          <span className="eyebrow">For the technical reader</span>
          <span className="mt-1 block text-base font-semibold text-ink">How the numbers are kept honest</span>
        </span>
        <span aria-hidden className={`text-lg text-muted transition-transform ${open ? "rotate-180" : ""}`}>↓</span>
      </button>
      {open &&
        (reduce ? (
          panel
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {panel}
          </motion.div>
        ))}
    </div>
  );
}
