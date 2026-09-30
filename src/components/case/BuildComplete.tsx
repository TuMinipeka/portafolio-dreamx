"use client";

import { useEffect } from "react";
import { useFlight } from "@/store/flight";

/**
 * Case study pages are always fully built. When arriving by client navigation
 * mid-compile (e.g. from the command palette), finish the build instantly.
 */
export function BuildComplete() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.build = "layout type color motion";
    root.style.setProperty("--build", "4");
    useFlight.getState().setStage(4);
    window.scrollTo(0, 0);
    useFlight.getState().lenis?.scrollTo(0, { immediate: true });
  }, []);

  return null;
}
