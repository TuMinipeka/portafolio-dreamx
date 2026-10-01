"use client";

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Plane,
  PointsMaterial,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { useLive } from "@/store/live";
import { sound } from "@/lib/sound";
import { emit, sonic } from "@/lib/sonic";
import { atmosphere, proximity } from "./atmosphere";
import { Anchor, paintLines, reduceMotion, type LineRef } from "./stage";

/* Access Hub: attendees streaming into a check-in gate, in real time. The cursor
   walks through the crowd and people step around it; every arrival is counted. */

const ATTENDEES = 220;
const OUTER = 3.4;
const GATE = 0.45;
const PERSONAL_SPACE = 0.9;

const ring = (radius: number) =>
  Array.from({ length: 97 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    return new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  });

export function Attendance({ index }: { index: number }) {
  const outerRef = useRef<LineRef>(null);
  const gateRef = useRef<LineRef>(null);
  const cursorRef = useRef<LineRef>(null);
  const cursorGroup = useRef<Group>(null);
  const plane = useRef<Group>(null);
  const still = useMemo(() => reduceMotion(), []);
  const { camera } = useThree();
  const outer = useMemo(() => ring(OUTER), []);
  const gate = useMemo(() => ring(GATE), []);
  const halo = useMemo(() => ring(PERSONAL_SPACE * 0.6), []);
  const tools = useMemo(
    () => ({ ray: new Raycaster(), ndc: new Vector2(), plane: new Plane(), hit: new Vector3(), normal: new Vector3() }),
    [],
  );

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
    const material = new PointsMaterial({ size: 0.075, transparent: true, depthWrite: false });
    return { angle, radius, speed, geometry, material };
  }, []);

  useFrame((_, delta) => {
    const fade = proximity(index);
    const dt = still ? 0 : Math.min(delta, 0.05);
    const positions = crowd.geometry.attributes.position;

    // Where the cursor touches the crowd's floor, in the floor's own coordinates.
    let cx = Infinity;
    let cz = Infinity;
    const floor = plane.current;
    if (floor && fade > 0.05) {
      floor.updateWorldMatrix(true, false);
      tools.normal.set(0, 1, 0).transformDirection(floor.matrixWorld);
      tools.plane.setFromNormalAndCoplanarPoint(tools.normal, floor.getWorldPosition(tools.hit));
      tools.ray.setFromCamera(tools.ndc.set(atmosphere.pointer.x, atmosphere.pointer.y), camera);
      if (tools.ray.ray.intersectPlane(tools.plane, tools.hit)) {
        floor.worldToLocal(tools.hit);
        if (Math.hypot(tools.hit.x, tools.hit.z) < OUTER + 0.6) {
          cx = tools.hit.x;
          cz = tools.hit.z;
        }
      }
    }
    if (cursorGroup.current) {
      cursorGroup.current.visible = Number.isFinite(cx);
      if (Number.isFinite(cx)) cursorGroup.current.position.set(cx, 0, cz);
    }

    let arrived = 0;
    for (let i = 0; i < ATTENDEES; i++) {
      // Spiral inward, faster near the gate, then check in and start over outside.
      crowd.radius[i] -= dt * crowd.speed[i] * 0.45;
      crowd.angle[i] += dt * crowd.speed[i] * (0.9 / crowd.radius[i]);
      if (crowd.radius[i] <= GATE) {
        crowd.radius[i] = OUTER + Math.random() * 0.4;
        crowd.angle[i] = Math.random() * Math.PI * 2;
        arrived++;
      }
      let x = Math.cos(crowd.angle[i]) * crowd.radius[i];
      let z = Math.sin(crowd.angle[i]) * crowd.radius[i];

      // Step around the cursor: push out of its personal space, softly.
      const dx = x - cx;
      const dz = z - cz;
      const d = Math.hypot(dx, dz);
      if (d < PERSONAL_SPACE && d > 0.0001) {
        const push = (1 - d / PERSONAL_SPACE) ** 2 * 0.55;
        x += (dx / d) * push;
        z += (dz / d) * push;
      }
      positions.setXYZ(i, x, 0, z);
    }
    positions.needsUpdate = true;
    if (arrived && fade > 0.3) {
      for (let n = 0; n < arrived; n++) useLive.getState().checkIn();
      emit({ type: "checkin" }, !!sound.engine);
    }

    // Sound: the crowd opens up around the cursor.
    sonic.level.hub = fade;
    const inside = Number.isFinite(cx) ? 1 - MathUtils.clamp(Math.hypot(cx, cz) / OUTER, 0, 1) : 0;
    sonic.crowdCursor = MathUtils.damp(sonic.crowdCursor, inside, 4, Math.max(dt, 0.016));

    crowd.material.color.copy(atmosphere.ink);
    crowd.material.opacity = 0.85 * fade;
    paintLines([outerRef.current], 0.2 * fade);
    paintLines([gateRef.current], fade);
    paintLines([cursorRef.current], 0.5 * fade);
  });

  return (
    <Anchor index={index}>
      <group ref={plane}>
        <Line ref={outerRef} points={outer} lineWidth={1} transparent dashed dashSize={0.12} gapSize={0.12} />
        <Line ref={gateRef} points={gate} lineWidth={2} transparent />
        <points geometry={crowd.geometry} material={crowd.material} />
        <group ref={cursorGroup} visible={false}>
          <Line ref={cursorRef} points={halo} lineWidth={1} transparent dashed dashSize={0.06} gapSize={0.06} />
        </group>
      </group>
    </Anchor>
  );
}
