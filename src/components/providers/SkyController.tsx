"use client";

import { useEffect } from "react";
import { flight } from "@/content/flight";
import { useFlight } from "@/store/flight";

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const skies = flight.map((w) => hexToRgb(w.sky));
// Altitude spans 0 m to 100 km, so interpolate in log space to keep the
// readout moving at a steady pace between waypoints.
const logAlt = flight.map((w) => Math.log10(w.altitude + 10));

/**
 * Maps scroll position to a point on the flight path. Each waypoint is
 * "reached" when its section is centered in the viewport; between waypoints
 * the sky color and altitude are interpolated.
 */
export function SkyController() {
  const setFlight = useFlight((s) => s.setFlight);

  useEffect(() => {
    const root = document.documentElement;
    let anchors: number[] = [];
    let frame = 0;

    const measure = () => {
      anchors = flight.map((w) => {
        const el = document.getElementById(w.id);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        return rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
      });
      anchors[0] = 0;
      update();
    };

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      let i = 0;
      while (i < anchors.length - 2 && y >= anchors[i + 1]) i++;
      const span = anchors[i + 1] - anchors[i] || 1;
      const t = Math.min(1, Math.max(0, (y - anchors[i]) / span));

      const [r0, g0, b0] = skies[i];
      const [r1, g1, b1] = skies[i + 1];
      const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
      root.style.setProperty("--sky", `rgb(${mix(r0, r1)} ${mix(g0, g1)} ${mix(b0, b1)})`);

      const current = t < 0.5 ? flight[i] : flight[i + 1];
      root.style.setProperty("--ink", current.dark ? "var(--color-cloud)" : "var(--color-graphite)");
      root.dataset.sky = current.dark ? "dark" : "light";

      const altitude = Math.max(0, 10 ** (logAlt[i] + (logAlt[i + 1] - logAlt[i]) * t) - 10);
      const atTop = y >= anchors[anchors.length - 1];
      setFlight({
        altitude: atTop ? flight[flight.length - 1].altitude : altitude,
        layer: current.layer,
        progress: (i + t) / (flight.length - 1),
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [setFlight]);

  return null;
}
