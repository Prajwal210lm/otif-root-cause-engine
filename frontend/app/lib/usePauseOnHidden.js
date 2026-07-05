"use client";

import { useEffect, useRef, useState } from "react";

// Pauses an SVG's SMIL animations (via the native pauseAnimations/
// unpauseAnimations DOM API) and reports tab-hidden state, for gating any
// CSS-driven animation, whenever the browser tab is hidden. Portfolio pages
// get left open in a background tab; there's no reason to keep animating
// for no one. Attach `svgRef` to the <svg> root that owns the SMIL elements.
export function usePauseOnHidden() {
  const svgRef = useRef(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onVisibility() {
      const isHidden = document.hidden;
      setHidden(isHidden);
      const svg = svgRef.current;
      if (svg && typeof svg.pauseAnimations === "function") {
        isHidden ? svg.pauseAnimations() : svg.unpauseAnimations();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return { svgRef, hidden };
}
