import { create } from "zustand";
import type Lenis from "lenis";
import type { LayerKey, StationId } from "@/content/flight";

type FlightState = {
  altitude: number;
  layer: LayerKey;
  /** Position along the waypoints: 0 at the ground, 1 at the Kármán line. */
  progress: number;
  setFlight: (next: Pick<FlightState, "altitude" | "layer" | "progress">) => void;
  /** Smooth-scroll instance. Programmatic scrolls must go through it (window.scrollTo gets overridden). */
  lenis: Lenis | null;
  setLenis: (lenis: Lenis | null) => void;
  /** Compile stage on the ground: 0 raw HTML, 1 layout, 2 type, 3 color, 4 motion. */
  stage: number;
  setStage: (stage: number) => void;
  /** How present the 3D world is (1 full, lower while reading a case study). */
  presence: number;
  setPresence: (presence: number) => void;
  /** A project-to-project transition in flight (see components/transition). */
  transition: { from: StationId | null; to: StationId; start: number } | null;
  setTransition: (transition: FlightState["transition"]) => void;
};

export const useFlight = create<FlightState>((set) => ({
  altitude: 0,
  layer: "ground",
  progress: 0,
  setFlight: (next) => set(next),
  lenis: null,
  setLenis: (lenis) => set({ lenis }),
  stage: 4,
  setStage: (stage) => set({ stage }),
  presence: 1,
  setPresence: (presence) => set({ presence }),
  transition: null,
  setTransition: (transition) => set({ transition }),
}));
