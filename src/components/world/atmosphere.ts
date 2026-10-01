import { Color, MathUtils } from "three";
import { flight } from "@/content/flight";

/** World units between two waypoints. Each section of the page lives one GAP higher. */
export const GAP = 14;
export const SEGMENTS = flight.length - 1;

const skies = flight.map((w) => new Color(w.sky));
const inkOnLight = new Color("#16181b");
const inkOnDark = new Color("#f3f5f6");

/**
 * Shared, mutable colors for the whole scene. The camera rig samples them once
 * per frame from flight progress; every object copies them into its material,
 * so the 3D lines always match the CSS sky and text color.
 */
export const atmosphere = {
  sky: new Color(skies[0]),
  ink: new Color(inkOnLight),
  /** 0 on light skies, 1 on dark ones. */
  darkness: 0,
  /** Smoothed flight progress, 0 at the ground, 1 at the Kármán line. */
  progress: 0,
  /** Smoothed world presence; every object's opacity is multiplied by it. */
  presence: 1,
  /** Smoothed cursor in normalized device coordinates (-1..1). The canvas never takes
   *  pointer events, so objects react to where the cursor is, not to clicks on them. */
  pointer: { x: 0, y: 0 },
  /** True while the primary button or a touch is held down. */
  pressed: false,
  /** World x of the right-hand "stage" column where station objects stand. 0 on narrow screens. */
  stageX: 0,
};

export function sampleAtmosphere(progress: number) {
  const x = MathUtils.clamp(progress, 0, 1) * SEGMENTS;
  const i = Math.min(Math.floor(x), SEGMENTS - 1);
  const t = x - i;
  atmosphere.progress = progress;
  atmosphere.sky.lerpColors(skies[i], skies[i + 1], t);
  const dark = MathUtils.lerp(Number(flight[i].dark), Number(flight[i + 1].dark), t);
  atmosphere.darkness = MathUtils.smoothstep(dark, 0.2, 0.8);
  atmosphere.ink.lerpColors(inkOnLight, inkOnDark, atmosphere.darkness);
}

/** Height of the camera's eye line when a waypoint is centered on screen. */
export const waypointY = (index: number) => index * GAP;

/**
 * Fades an object in only while the camera is near its altitude, so each
 * station owns its stretch of sky and doesn't bleed into the next one.
 */
export function proximity(objectWaypoint: number, reach = 0.75) {
  const distance = Math.abs(atmosphere.progress * SEGMENTS - objectWaypoint);
  return (1 - MathUtils.smoothstep(distance, reach * 0.4, reach)) * atmosphere.presence;
}
