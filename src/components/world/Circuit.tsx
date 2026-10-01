"use client";

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, CylinderGeometry, Group, MathUtils, Vector3 } from "three";
import { sound } from "@/lib/sound";
import { emit, sonic } from "@/lib/sonic";
import { proximity } from "./atmosphere";
import { Anchor, box, paintLines, reduceMotion, Solid, useSolidMaterials, type LineRef } from "./stage";

/* APEX: a circuit with a low-poly single-seater on a flying lap. */

export const CIRCUIT = [
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

const wheel = new CylinderGeometry(0.09, 0.09, 0.08, 14).rotateZ(Math.PI / 2);

/**
 * A modern F1 car built from boxes, nose pointing down +z: tub, nose cone,
 * sidepods, halo, front and rear wings with endplates, and four exposed wheels.
 */
function SingleSeater({
  materials,
  spin,
}: {
  materials: ReturnType<typeof useSolidMaterials>;
  spin: React.RefObject<Group[]>;
}) {
  const wheels: [number, number][] = [
    [0.21, 0.36],
    [-0.21, 0.36],
    [0.22, -0.34],
    [-0.22, -0.34],
  ];
  return (
    <group>
      <Solid geometry={box(0.17, 0.09, 0.62)} materials={materials} position={[0, 0.08, -0.02]} />
      <Solid
        geometry={box(0.09, 0.06, 0.34)}
        materials={materials}
        position={[0, 0.06, 0.45]}
        rotation={[0.08, 0, 0]}
      />
      <Solid geometry={box(0.11, 0.07, 0.32)} materials={materials} position={[0.14, 0.06, -0.04]} />
      <Solid geometry={box(0.11, 0.07, 0.32)} materials={materials} position={[-0.14, 0.06, -0.04]} />
      <Solid
        geometry={box(0.12, 0.03, 0.16)}
        materials={materials}
        position={[0, 0.16, 0.06]}
        rotation={[-0.35, 0, 0]}
      />
      <Solid geometry={box(0.46, 0.015, 0.09)} materials={materials} position={[0, 0.02, 0.62]} />
      <Solid geometry={box(0.36, 0.02, 0.1)} materials={materials} position={[0, 0.2, -0.36]} />
      <Solid geometry={box(0.015, 0.14, 0.12)} materials={materials} position={[0.18, 0.16, -0.36]} />
      <Solid geometry={box(0.015, 0.14, 0.12)} materials={materials} position={[-0.18, 0.16, -0.36]} />
      {wheels.map(([x, z], i) => (
        <group
          key={i}
          position={[x, 0.09, z]}
          ref={(g) => {
            if (g) spin.current[i] = g;
          }}
        >
          <Solid geometry={wheel} materials={materials} />
        </group>
      ))}
    </group>
  );
}

export function Circuit({ index }: { index: number }) {
  const curve = useMemo(() => new CatmullRomCurve3(CIRCUIT, true, "centripetal"), []);
  const track = useMemo(() => curve.getSpacedPoints(240), [curve]);
  const trackRef = useRef<LineRef>(null);
  const trailRef = useRef<LineRef>(null);
  const car = useRef<Group>(null);
  const wheels = useRef<Group[]>([]);
  const lap = useRef(0);
  const still = useMemo(() => reduceMotion(), []);
  const materials = useSolidMaterials();
  const trail = useMemo(() => new Float32Array(16 * 3), []);
  const point = useMemo(() => new Vector3(), []);
  const ahead = useMemo(() => new Vector3(), []);
  const tangents = useMemo(() => ({ a: new Vector3(), b: new Vector3(), screen: new Vector3() }), []);
  const pace = useRef({ speed: 1, distance: 0 });
  const { camera } = useThree();

  useFrame((_, delta) => {
    const fade = proximity(index);
    const dt = still ? 0 : Math.min(delta, 0.05);

    // Corners slow the car, straights let it run: curvature from how much the tangent turns ahead.
    curve.getTangentAt(lap.current, tangents.a);
    curve.getTangentAt((lap.current + 0.012) % 1, tangents.b);
    const corner = MathUtils.clamp(tangents.a.angleTo(tangents.b) * 2.2, 0, 1);
    const before = pace.current.speed;
    pace.current.speed = MathUtils.damp(pace.current.speed, 1 - corner, 3, Math.max(dt, 0.001));
    lap.current = (lap.current + dt * 0.05 * (0.55 + 0.9 * pace.current.speed)) % 1;
    if (before < 0.62 && pace.current.speed >= 0.62) emit({ type: "shift" }, !!sound.engine && fade > 0.2);

    for (let i = 0; i < 16; i++) {
      curve.getPointAt((lap.current - i * 0.004 + 1) % 1, point);
      point.toArray(trail, i * 3);
    }
    trailRef.current?.geometry.setPositions(trail);

    if (car.current) {
      curve.getPointAt(lap.current, point);
      curve.getPointAt((lap.current + 0.003) % 1, ahead);
      car.current.position.copy(point);
      car.current.lookAt(ahead.applyMatrix4(car.current.parent!.matrixWorld));
    }
    for (const w of wheels.current) w.rotation.x += dt * 22;

    // Sound: revs, stereo position and approach speed (for Doppler) of the car.
    sonic.level.apex = fade;
    sonic.carSpeed = pace.current.speed;
    if (car.current && fade > 0.01) {
      car.current.getWorldPosition(tangents.screen);
      const distance = tangents.screen.distanceTo(camera.position);
      sonic.carApproach = MathUtils.clamp((pace.current.distance - distance) / Math.max(dt, 0.001) / 3, -1, 1);
      pace.current.distance = distance;
      sonic.carPan = tangents.screen.project(camera).x;
    }

    materials.paint(fade);
    paintLines([trackRef.current], 0.45 * fade);
    paintLines([trailRef.current], 0.9 * fade);
  });

  return (
    <Anchor index={index}>
      <group scale={1.15}>
        <Line ref={trackRef} points={track} lineWidth={1.2} transparent />
        <Line ref={trailRef} points={track.slice(0, 16)} lineWidth={2.4} transparent />
        <group ref={car} scale={1.25}>
          <SingleSeater materials={materials} spin={wheels} />
        </group>
      </group>
    </Anchor>
  );
}
