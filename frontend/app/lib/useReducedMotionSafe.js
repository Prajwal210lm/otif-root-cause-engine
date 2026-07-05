"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// SSR-safe reduced-motion: returns false during SSR + first client render so the
// hydrated markup matches the server, then reflects the user's true preference
// after mount. Prevents hydration mismatches in components that branch on motion.
export function useReducedMotionSafe() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!reduce;
}
