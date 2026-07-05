"use client";

import { useEffect, useState } from "react";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";
import { useReveal } from "../lib/useReveal";

/**
 * Animates a number from 0 to `value` once it scrolls into view (with a fallback
 * so it never stays at 0). rAF tween, ~1.1s ease-out. Reduced motion → final value.
 */
export default function CountUp({ value, decimals = 0, prefix = "", suffix = "", durationMs = 1100 }) {
  const reduce = useReducedMotionSafe();
  const [ref, shown] = useReveal(0.4);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!shown) return;
    if (reduce) {
      setN(value);
      return;
    }
    let raf;
    let start = null;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (ts) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / durationMs);
      setN(value * easeOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, reduce, value, durationMs]);

  const body = n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className="tnum">
      {prefix}
      {body}
      {suffix}
    </span>
  );
}
