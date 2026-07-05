"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";
import { useReveal } from "../lib/useReveal";

// Horizontal bar that grows to `pct`% when scrolled into view (with fallback).
export default function GrowBar({ pct, color, height = "h-2.5", track = "bg-hairline" }) {
  const reduce = useReducedMotionSafe();
  const [ref, shown] = useReveal(0.3);
  return (
    <div ref={ref} aria-hidden="true" className={`relative w-full overflow-hidden rounded-full ${track} ${height}`}>
      {reduce ? (
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      ) : (
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={shown ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </div>
  );
}
