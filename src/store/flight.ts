import { create } from "zustand";
import type Lenis from "lenis";
import type { LayerKey } from "@/content/flight";

type FlightState = {
  altitude: number;
  layer: LayerKey;
  /** Position along the waypoints: 0 at the ground, 1 at the Kármán line. */
  progress: number;
  setFlight: (next: Pick<FlightState, "altitude" | "layer" | "progress">) => void;
  /** Smooth-scroll instance. Programmatic scrolls must go through it (window.scrollTo gets overridden). */
  lenis: Lenis | null;
  setLenis: (lenis: Lenis | null) => void;
};

export const useFlight = create<FlightState>((set) => ({
  altitude: 0,
  layer: "ground",
  progress: 0,
  setFlight: (next) => set(next),
  lenis: null,
  setLenis: (lenis) => set({ lenis }),
}));
