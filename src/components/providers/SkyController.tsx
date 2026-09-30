"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
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
 *
 * On a case study page (marked with data-station-page) the flight is parked at
 * that station instead, and the 3D world fades back as the visitor starts reading.
 */
export function SkyController() {
  const setFlight = useFlight((s) => s.setFlight);
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const parked = document.querySelector<HTMLElement>("[data-station-page]");
    if (parked) return park(parked.dataset.stationPage ?? "");
    useFlight.getState().setPresence(narrowScreenPresence());

    let anchors: number[] = [];
    let frame = 0;

    const measure = () => {
      anchors = flight.map((w) => {
        const el = document.getElementById(w.id);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        // The hero is a tall compile track: we only leave the ground once it ends.
        if (w.id === "hero") return Math.max(0, top + rect.height - window.innerHeight);
        return top + rect.height / 2 - window.innerHeight / 2;
      });
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
  }, [setFlight, pathname]);

  return null;
}

// On phones text spans the full width, so the 3D lines would cross it: keep them faint.
const narrowScreenPresence = () => (window.matchMedia("(max-width: 767px)").matches ? 0.35 : 1);

function park(id: string) {
  const root = document.documentElement;
  const index = Math.max(0, flight.findIndex((w) => w.id === id));
  const waypoint = flight[index];
  const { setFlight, setPresence } = useFlight.getState();

  root.style.setProperty("--sky", waypoint.sky);
  root.style.setProperty("--ink", waypoint.dark ? "var(--color-cloud)" : "var(--color-graphite)");
  root.dataset.sky = waypoint.dark ? "dark" : "light";
  setFlight({ altitude: waypoint.altitude, layer: waypoint.layer, progress: index / (flight.length - 1) });

  // Full presence over the case header, then a faint backdrop behind the reading.
  const onScroll = () => {
    const t = Math.min(1, window.scrollY / (window.innerHeight * 0.8));
    setPresence((1 - t * 0.82) * narrowScreenPresence());
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}
