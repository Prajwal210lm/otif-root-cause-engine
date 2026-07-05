"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

// Scroll-reveal trigger with a guaranteed fallback: returns [ref, shown].
// `shown` becomes true when the element scrolls into view OR after a timeout,
// so content is never left stuck at opacity 0 if an in-view event is missed
// (fast scrolls, bottom-of-page elements, headless screenshots, deep links).
export function useReveal(amount = 0.15, fallbackMs = 2400) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFallback(true), fallbackMs);
    return () => clearTimeout(t);
  }, [fallbackMs]);
  return [ref, inView || fallback];
}
