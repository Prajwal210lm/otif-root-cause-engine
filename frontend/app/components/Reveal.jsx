"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "../lib/useReducedMotionSafe";
import { useReveal } from "../lib/useReveal";

// Scroll-triggered fade/translate reveal with a fallback so content never stays
// hidden. Reduced motion → renders static and visible.
export default function Reveal({ children, delay = 0, y = 18, className = "" }) {
  const reduce = useReducedMotionSafe();
  const [ref, shown] = useReveal();
  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
