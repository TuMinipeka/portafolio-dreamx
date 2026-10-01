/**
 * What the 3D world tells the sound. Station objects write their state here every
 * frame (how close they are, how fast things move, what the cursor is over) and push
 * one-off events; the soundscape reads it. Plain mutable data: no React, no re-renders.
 */

export type SonicEvent =
  | { type: "checkin" }
  | { type: "packet"; tenant: number; pan: number }
  | { type: "star"; note: number }
  | { type: "arpeggio"; notes: number[] }
  | { type: "grip"; closed: boolean }
  | { type: "shift" };

export const sonic = {
  /** 0..1 audibility of each scene: the same proximity × presence as its 3D object. */
  level: { log: 0, about: 0, apex: 0, hub: 0, tenant: 0, contact: 0 },
  /** Robotic arm: joint angular speed (rad/s). */
  armSpeed: 0,
  /** F1 car: 0 in the tightest corner, 1 flat out; screen x (-1..1); approach speed toward the camera. */
  carSpeed: 0,
  carPan: 0,
  carApproach: 0,
  /** Hub: 0..1, how deep the cursor is in the crowd. */
  crowdCursor: 0,
  /** TENANT: hovered company, or -1. */
  tenantFocus: -1,
  /** Contact: how fast the logo is turning (rad/s). */
  logoSpin: 0,
  queue: [] as SonicEvent[],
};

/** Queue an event, but only while sound could hear it (keeps the queue from growing when muted). */
export function emit(event: SonicEvent, listening: boolean) {
  if (listening && sonic.queue.length < 64) sonic.queue.push(event);
}
