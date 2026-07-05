"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";
import { useReveal } from "../lib/useReveal";

// The OTIF gap: current rate filled in teal, the shortfall to target shaded,
// a target tick, and the "1 in 11" read-out. Animates in on view (with fallback).
export default function OtifGap({ now = 91, target = 95 }) {
  const reduce = useReducedMotionSafe();
  const [ref, shown] = useReveal(0.4);
  const gap = target - now;
  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="tnum text-4xl font-bold text-accent">{now}%</span>
          <span className="text-sm text-muted">OTIF today</span>
        </div>
        <span className="text-sm text-muted">
          board target <span className="tnum font-semibold text-ink">{target}%</span>
        </span>
      </div>

      <div aria-hidden="true" className="relative mt-5 h-3 w-full overflow-hidden rounded-full bg-hairline">
        {/* the shortfall band (now → target) */}
        <div className="absolute inset-y-0 bg-accent-soft/60" style={{ left: `${now}%`, width: `${gap}%` }} />
        {/* current OTIF fill */}
        {reduce ? (
          <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${now}%` }} />
        ) : (
          <motion.div
            className="absolute inset-y-0 left-0 bg-accent"
            initial={{ width: 0 }}
            animate={shown ? { width: `${now}%` } : { width: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </div>

      {/* target tick + labels (decorative; the values live in the text above) */}
      <div aria-hidden="true" className="relative mt-2 h-4 font-mono text-[11px]">
        <span className="tnum absolute left-0 text-accent">{now}% today</span>
        <span className="tnum absolute -translate-x-1/2 whitespace-nowrap text-ink" style={{ left: `${target}%` }}>
          {target}% target
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        That {gap}-point gap is roughly <span className="font-semibold text-ink">1 in 11 orders</span>{" "}
        landing late or short.
      </p>
    </div>
  );
}
