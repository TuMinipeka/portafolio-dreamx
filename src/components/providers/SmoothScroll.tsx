"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useFlight } from "@/store/flight";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scroll driven by GSAP's ticker, so ScrollTrigger and Lenis
 * share one clock. Skipped entirely when the visitor prefers reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ anchors: true, lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    useFlight.getState().setLenis(lenis);
    // Handle for browser automation in dev: programmatic window.scrollTo is overridden by Lenis.
    if (process.env.NODE_ENV === "development") Object.assign(window, { __lenis: lenis });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      useFlight.getState().setLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
