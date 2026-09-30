"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PointsMaterial,
  Vector3,
} from "three";
import type { Line2, LineSegments2 } from "three-stdlib";
import { atmosphere, proximity, waypointY } from "./atmosphere";

type LineRef = Line2 | LineSegments2;

/** Keeps a set of drei lines in the scene's ink color at a given opacity. */
function paintLines(lines: (LineRef | null)[], opacity: number) {
  for (const line of lines) {
    if (!line) continue;
    line.material.color.copy(atmosphere.ink);
    line.material.opacity = opacity;
  }
}

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Anchors a station's object in the sky: centered where the camera looks when
 * that section is on screen, slightly left of center where the layout leaves room.
 */
function Anchor({ index, children, tilt = 0.55 }: { index: number; children: ReactNode; tilt?: number }) {
  return (
    <group position={[-1.6, waypointY(index) + 1.2 - 4.2, -6]} rotation={[tilt, 0, 0]}>
      {children}
    </group>
  );
}

/* ---------------- APEX: a circuit with a car on a flying lap ---------------- */

const CIRCUIT = [
  [-3, 0],
  [-2.3, -1.3],
  [-0.7, -1.6],
  [0.3, -0.8],
  [1.5, -1.5],
  [3, -1.1],
  [3.3, 0.2],
  [2.1, 0.9],
  [0.7, 0.5],
  [-0.3, 1.4],
  [-2.1, 1.5],
].map(([x, z]) => new Vector3(x, 0, z));

export function Circuit({ index }: { index: number }) {
  const curve = useMemo(() => new CatmullRomCurve3(CIRCUIT, true, "centripetal"), []);
  const track = useMemo(() => curve.getSpacedPoints(240), [curve]);
  const trackRef = useRef<LineRef>(null);
  const trailRef = useRef<LineRef>(null);
  const car = useRef<Mesh>(null);
  const lap = useRef(0);
  const still = useMemo(() => reduceMotion(), []);
  const trail = useMemo(() => new Float32Array(16 * 3), []);
  const point = useMemo(() => new Vector3(), []);

  useFrame((_, delta) => {
    const fade = proximity(index);
    if (!still) lap.current = (lap.current + delta * 0.075) % 1;

    // Trail: the last few meters behind the car.
    for (let i = 0; i < 16; i++) {
      curve.getPointAt((lap.current - i * 0.004 + 1) % 1, point);
      point.toArray(trail, i * 3);
    }
    trailRef.current?.geometry.setPositions(trail);
    if (car.current) {
      car.current.position.fromArray(trail, 0);
      const material = car.current.material as MeshBasicMaterial;
      material.color.copy(atmosphere.ink);
      material.opacity = fade;
    }

    paintLines([trackRef.current], 0.45 * fade);
    paintLines([trailRef.current], fade);
  });

  return (
    <Anchor index={index}>
      <Line ref={trackRef} points={track} lineWidth={1.2} transparent />
      <Line ref={trailRef} points={track.slice(0, 16)} lineWidth={2.4} transparent />
      <mesh ref={car}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial transparent />
      </mesh>
    </Anchor>
  );
}

/* ------- Access Hub: attendees streaming into a check-in gate, in real time ------- */

const ATTENDEES = 180;
const OUTER = 3.4;
const GATE = 0.45;

export function Attendance({ index }: { index: number }) {
  const outerRef = useRef<LineRef>(null);
  const gateRef = useRef<LineRef>(null);
  const still = useMemo(() => reduceMotion(), []);

  const ring = (radius: number) =>
    Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      return new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    });
  const outer = useMemo(() => ring(OUTER), []);
  const gate = useMemo(() => ring(GATE), []);

  const crowd = useMemo(() => {
    const angle = new Float32Array(ATTENDEES);
    const radius = new Float32Array(ATTENDEES);
    const speed = new Float32Array(ATTENDEES);
    for (let i = 0; i < ATTENDEES; i++) {
      angle[i] = Math.random() * Math.PI * 2;
      radius[i] = GATE + Math.random() * (OUTER - GATE);
      speed[i] = 0.35 + Math.random() * 0.5;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(ATTENDEES * 3), 3));
    const material = new PointsMaterial({ size: 0.07, transparent: true, depthWrite: false });
    return { angle, radius, speed, geometry, material };
  }, []);

  useFrame((_, delta) => {
    const fade = proximity(index);
    const dt = still ? 0 : Math.min(delta, 0.05);
    const positions = crowd.geometry.attributes.position;

    for (let i = 0; i < ATTENDEES; i++) {
      // Spiral inward, faster near the gate, then check in and start over outside.
      crowd.radius[i] -= dt * crowd.speed[i] * 0.45;
      crowd.angle[i] += dt * crowd.speed[i] * (0.9 / crowd.radius[i]);
      if (crowd.radius[i] <= GATE) {
        crowd.radius[i] = OUTER + Math.random() * 0.4;
        crowd.angle[i] = Math.random() * Math.PI * 2;
      }
      positions.setXYZ(
        i,
        Math.cos(crowd.angle[i]) * crowd.radius[i],
        0,
        Math.sin(crowd.angle[i]) * crowd.radius[i],
      );
    }
    positions.needsUpdate = true;

    crowd.material.color.copy(atmosphere.ink);
    crowd.material.opacity = 0.85 * fade;
    paintLines([outerRef.current], 0.2 * fade);
    paintLines([gateRef.current], fade);
  });

  return (
    <Anchor index={index}>
      <Line ref={outerRef} points={outer} lineWidth={1} transparent dashed dashSize={0.12} gapSize={0.12} />
      <Line ref={gateRef} points={gate} lineWidth={2} transparent />
      <points geometry={crowd.geometry} material={crowd.material} />
    </Anchor>
  );
}

/* ------- TENANT: shared core, isolated tenants, data never crossing between them ------- */

const TENANTS = 5;
const STRATA = [-0.9, 0, 0.9];

export function Strata({ index }: { index: number }) {
  const group = useRef<Group>(null);
  const lineRefs = useRef<(LineRef | null)[]>([]);
  const pulseRefs = useRef<(Mesh | null)[]>([]);
  const still = useMemo(() => reduceMotion(), []);
  const clock = useRef(0);

  const shape = useMemo(() => {
    const square = (size: number, y: number, cx = 0, cz = 0) => {
      const h = size / 2;
      return [
        [cx - h, y, cz - h],
        [cx + h, y, cz - h],
        [cx + h, y, cz + h],
        [cx - h, y, cz + h],
        [cx - h, y, cz - h],
      ].map((p) => new Vector3(...p));
    };
    const islands = Array.from({ length: TENANTS }, (_, i) => {
      const a = (i / TENANTS) * Math.PI * 2 + 0.3;
      return new Vector3(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6);
    });
    return {
      strata: STRATA.map((y) => square(6.4, y)),
      core: [new Vector3(0, -1.3, 0), new Vector3(0, 1.3, 0)],
      islands,
      tenantBoxes: islands.flatMap((c) => STRATA.map((y) => square(0.55, y, c.x, c.z))),
      links: islands.map((c) => [new Vector3(0, 0, 0), c]),
    };
  }, []);

  useFrame((_, delta) => {
    const fade = proximity(index);
    if (!still) clock.current += delta;
    if (group.current) group.current.rotation.y = clock.current * 0.08;

    const lines = lineRefs.current;
    paintLines(lines.slice(0, STRATA.length), 0.18 * fade);
    paintLines(lines.slice(STRATA.length), 0.7 * fade);

    // A pulse per tenant: core to island and back. Never island to island.
    pulseRefs.current.forEach((pulse, i) => {
      if (!pulse) return;
      const t = (Math.sin(clock.current * 0.9 + i * 1.3) + 1) / 2;
      pulse.position.lerpVectors(shape.links[i][0], shape.links[i][1], t);
      const material = pulse.material as MeshBasicMaterial;
      material.color.copy(atmosphere.ink);
      material.opacity = fade;
    });
  });

  let n = 0;
  const ref = () => {
    const slot = n++;
    return (line: LineRef | null) => {
      lineRefs.current[slot] = line;
    };
  };

  return (
    <Anchor index={index} tilt={0.35}>
      <group ref={group}>
        {shape.strata.map((points, i) => (
          <Line key={`s${i}`} ref={ref()} points={points} lineWidth={1} transparent />
        ))}
        <Line ref={ref()} points={shape.core} lineWidth={2.2} transparent />
        {shape.tenantBoxes.map((points, i) => (
          <Line key={`t${i}`} ref={ref()} points={points} lineWidth={1.2} transparent />
        ))}
        {shape.links.map((points, i) => (
          <Line key={`l${i}`} ref={ref()} points={points} lineWidth={1} transparent dashed dashSize={0.1} gapSize={0.08} />
        ))}
        {shape.links.map((_, i) => (
          <mesh
            key={`p${i}`}
            ref={(m) => {
              pulseRefs.current[i] = m;
            }}
          >
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial transparent />
          </mesh>
        ))}
      </group>
    </Anchor>
  );
}

/* ---------------- Kármán line: the stars come out ---------------- */

export function Stars({ index }: { index: number }) {
  const stars = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const v = new Vector3();
    for (let i = 0; i < count; i++) {
      v.randomDirection().multiplyScalar(40 + Math.random() * 40);
      v.y = Math.abs(v.y) * 0.8 - 6; // mostly above the horizon
      v.toArray(positions, i * 3);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: "#f3f5f6",
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    return { geometry, material };
  }, []);

  useFrame(() => {
    stars.material.opacity = MathUtils.smoothstep(atmosphere.darkness, 0.6, 1) * proximity(index, 1.6);
  });

  return <points position={[0, waypointY(index), 0]} geometry={stars.geometry} material={stars.material} />;
}
