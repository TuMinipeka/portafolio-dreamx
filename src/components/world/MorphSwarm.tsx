"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Euler,
  Float32BufferAttribute,
  MathUtils,
  Matrix4,
  PointsMaterial,
  Quaternion,
  Vector3,
} from "three";
import { flight, type StationId } from "@/content/flight";
import { useFlight } from "@/store/flight";
import { atmosphere, waypointY } from "./atmosphere";
import { CIRCUIT } from "./Circuit";

/* During a project transition, the current instrument comes apart into particles
   that travel (with the camera) to the next station and re-form as its instrument:
   circuit → crowd → strata. Same station? They scatter and snap back. */

const COUNT = 700;
const DURATION = 1200;

type Shape = StationId | null;

/** Points in the station object's own coordinates (same layouts as the real objects). */
function sample(shape: Shape, out: Float32Array) {
  const v = new Vector3();
  if (shape === "apex") {
    const curve = new CatmullRomCurve3(CIRCUIT, true, "centripetal");
    for (let i = 0; i < COUNT; i++) {
      curve.getPointAt(i / COUNT, v).multiplyScalar(1.15);
      v.toArray(out, i * 3);
    }
  } else if (shape === "hub") {
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = i % 5 === 0 ? 0.45 : 0.6 + Math.sqrt(Math.random()) * 2.8;
      v.set(Math.cos(a) * r, 0, Math.sin(a) * r).toArray(out, i * 3);
    }
  } else if (shape === "tenant") {
    const strata = [-0.9, 0, 0.9];
    for (let i = 0; i < COUNT; i++) {
      const y = strata[i % 3];
      const island = i % 4 === 0;
      const t = Math.random() * 4;
      const side = Math.floor(t);
      const f = t - side;
      let x = side === 0 ? f : side === 1 ? 1 : side === 2 ? 1 - f : 0;
      let z = side === 0 ? 0 : side === 1 ? f : side === 2 ? 1 : 1 - f;
      if (island) {
        const k = Math.floor(Math.random() * 5);
        const a = (k / 5) * Math.PI * 2 + 0.3;
        x = Math.cos(a) * 2.6 + (x - 0.5) * 0.55;
        z = Math.sin(a) * 2.6 + (z - 0.5) * 0.55;
      } else {
        x = (x - 0.5) * 6.4;
        z = (z - 0.5) * 6.4;
      }
      v.set(x, y, z).toArray(out, i * 3);
    }
  } else {
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 3;
      v.set(Math.cos(a) * r, -1.5, Math.sin(a) * r).toArray(out, i * 3);
    }
  }
}

const TILT: Record<string, number> = { apex: 0.55, hub: 0.55, tenant: 0.35 };

/** From station-local to world: same placement as Anchor (minus the cursor lean). */
function toWorld(shape: Shape, points: Float32Array) {
  const index = flight.findIndex((w) => w.id === (shape ?? "hero"));
  const matrix = new Matrix4().compose(
    new Vector3(atmosphere.stageX, waypointY(index) + 1.2 - 4.2, -6),
    new Quaternion().setFromEuler(new Euler(TILT[shape ?? ""] ?? 0, 0, 0)),
    new Vector3(1, 1, 1),
  );
  const v = new Vector3();
  for (let i = 0; i < COUNT; i++)
    v.fromArray(points, i * 3)
      .applyMatrix4(matrix)
      .toArray(points, i * 3);
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function MorphSwarm() {
  const state = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(COUNT * 3), 3));
    const material = new PointsMaterial({ size: 0.065, transparent: true, depthWrite: false, opacity: 0 });
    return {
      geometry,
      material,
      from: new Float32Array(COUNT * 3),
      to: new Float32Array(COUNT * 3),
      jitter: Float32Array.from({ length: COUNT * 3 }, () => Math.random() * 2 - 1),
    };
  }, []);
  const started = useRef(0);

  useFrame(() => {
    const transition = useFlight.getState().transition;
    const { material, geometry } = state;

    if (transition && transition.start !== started.current) {
      started.current = transition.start;
      sample(transition.from, state.from);
      toWorld(transition.from, state.from);
      sample(transition.to, state.to);
      toWorld(transition.to, state.to);
    }

    const t = started.current ? (performance.now() - started.current) / DURATION : 2;
    if (t > 1.25) {
      material.visible = false;
      return;
    }
    material.visible = true;

    const appear = MathUtils.smoothstep(t, 0, 0.15);
    const leave = 1 - MathUtils.smoothstep(t, 0.85, 1.15);
    material.opacity = appear * leave * 0.9;
    material.color.copy(atmosphere.ink);

    // Travel between 20% and 75% of the transition, bulging outward mid-flight.
    const m = easeInOut(MathUtils.clamp((t - 0.2) / 0.55, 0, 1));
    const bulge = Math.sin(Math.PI * m) * 0.9;
    const positions = geometry.attributes.position;
    for (let i = 0; i < COUNT * 3; i++) {
      (positions.array as Float32Array)[i] =
        state.from[i] + (state.to[i] - state.from[i]) * m + state.jitter[i] * bulge;
    }
    positions.needsUpdate = true;
  });

  return <points geometry={state.geometry} material={state.material} frustumCulled={false} />;
}
