"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";

// "For the technical reader" disclosure: the three responsibility verdicts each
// agent can file. Kept behind a toggle so the jargon does not tax a lay reader.
const LEVELS = [
  { tag: "binding", body: "The deciding cause. Fix this and the order ships in full, on time." },
  { tag: "contributing", body: "A smaller factor that made the failure worse but did not decide it." },
  { tag: "incidental", body: "Its signal fired, but it was not the story on this order." },
];

export default function MethodTechnical() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotionSafe();

  const panel = (
    <div className="mt-6 border-t border-hairline pt-6">
      <p className="max-w-[760px] text-sm leading-relaxed text-muted">
        In the code, each agent files exactly one of three verdicts for its own team. The
        coordinator&rsquo;s job is to pick the single <span className="font-medium text-ink">binding</span>{" "}
        cause when more than one team fired.
      </p>
      <dl className="mt-5 grid gap-4 md:grid-cols-3">
        {LEVELS.map((l) => (
          <div key={l.tag} className="rounded-lg border border-hairline bg-surface p-5">
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">{l.tag}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted">{l.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return (
    <div className="rounded-xl border border-hairline bg-raised p-6 md:p-7">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span>
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-faint">For the technical reader</span>
          <span className="mt-1 block text-base font-semibold text-ink">The three levels of responsibility</span>
        </span>
        <span aria-hidden className={`text-lg text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}>↓</span>
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
