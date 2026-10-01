"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CylinderGeometry, Group, MathUtils } from "three";
import { sound } from "@/lib/sound";
import { emit, sonic } from "@/lib/sonic";
import { atmosphere, proximity } from "./atmosphere";
import { Anchor, box, reduceMotion, Solid, useSolidMaterials } from "./stage";

/* Logbook: a robotic forearm, like the master-slave arm Daniel built in school.
   The cursor plays the glove: the arm turns and reaches toward it, and pressing
   the mouse (or a finger on a touch screen) closes the hand. */

const base = new CylinderGeometry(0.7, 0.8, 0.22, 24);
const turret = new CylinderGeometry(0.34, 0.38, 0.42, 20);
const joint = new CylinderGeometry(0.2, 0.2, 0.36, 18).rotateZ(Math.PI / 2);
const knuckle = new CylinderGeometry(0.06, 0.06, 0.11, 10).rotateZ(Math.PI / 2);

const FINGERS = [-0.17, 0, 0.17];

export function RobotArm({ index }: { index: number }) {
  const materials = useSolidMaterials();
  const yaw = useRef<Group>(null);
  const shoulder = useRef<Group>(null);
  const elbow = useRef<Group>(null);
  const wrist = useRef<Group>(null);
  const fingers = useRef<Group[]>([]);
  const tips = useRef<Group[]>([]);
  const grip = useRef(0);
  const clock = useRef(0);
  const still = useMemo(() => reduceMotion(), []);
  const previous = useRef({ angles: 0, pressed: false });

  useFrame((_, delta) => {
    const fade = proximity(index);
    const dt = Math.min(delta, 0.1);
    if (!still) clock.current += dt;
    const { x, y } = atmosphere.pointer;
    const sway = Math.sin(clock.current * 0.8) * 0.05;

    // Servo-like easing: each joint chases its target a little slower than the one before.
    if (yaw.current) yaw.current.rotation.y = MathUtils.damp(yaw.current.rotation.y, x * 1.1 + sway, 5, dt);
    if (shoulder.current)
      shoulder.current.rotation.x = MathUtils.damp(shoulder.current.rotation.x, 0.35 - y * 0.45, 4, dt);
    if (elbow.current) elbow.current.rotation.x = MathUtils.damp(elbow.current.rotation.x, 0.85 + y * 0.35, 3.5, dt);
    if (wrist.current) wrist.current.rotation.x = MathUtils.damp(wrist.current.rotation.x, 0.45 - y * 0.2, 3, dt);

    grip.current = MathUtils.damp(grip.current, atmosphere.pressed ? 1 : 0.1, 10, dt);
    fingers.current.forEach((f) => (f.rotation.x = grip.current * 0.9));
    tips.current.forEach((t) => (t.rotation.x = grip.current * 1.1));

    materials.paint(fade);

    // Sound: the servo follows how fast the joints are moving; the gripper clacks.
    const angles =
      (yaw.current?.rotation.y ?? 0) + (shoulder.current?.rotation.x ?? 0) + (elbow.current?.rotation.x ?? 0);
    sonic.level.log = fade;
    sonic.armSpeed = MathUtils.damp(
      sonic.armSpeed,
      Math.abs(angles - previous.current.angles) / Math.max(dt, 0.001),
      10,
      dt,
    );
    previous.current.angles = angles;
    if (atmosphere.pressed !== previous.current.pressed) {
      emit({ type: "grip", closed: atmosphere.pressed }, !!sound.engine && fade > 0.2);
      previous.current.pressed = atmosphere.pressed;
    }
  });

  return (
    <Anchor index={index} tilt={0.15} follow={0.1}>
      <group position={[0, -2.2, 0]} scale={1.35}>
        <Solid geometry={base} materials={materials} />
        <group ref={yaw}>
          <Solid geometry={turret} materials={materials} position={[0, 0.32, 0]} />
          <group ref={shoulder} position={[0, 0.6, 0]}>
            <Solid geometry={joint} materials={materials} />
            <Solid geometry={box(0.26, 1.5, 0.26)} materials={materials} position={[0, 0.75, 0]} />
            <group ref={elbow} position={[0, 1.5, 0]}>
              <Solid geometry={joint} materials={materials} />
              <Solid geometry={box(0.22, 1.3, 0.22)} materials={materials} position={[0, 0.65, 0]} />
              <group ref={wrist} position={[0, 1.3, 0]}>
                <Solid geometry={box(0.52, 0.14, 0.34)} materials={materials} position={[0, 0.07, 0]} />
                {FINGERS.map((fx, i) => (
                  <group
                    key={fx}
                    position={[fx, 0.14, 0.08]}
                    ref={(g) => {
                      if (g) fingers.current[i] = g;
                    }}
                  >
                    <Solid geometry={knuckle} materials={materials} />
                    <Solid geometry={box(0.09, 0.26, 0.09)} materials={materials} position={[0, 0.13, 0]} />
                    <group
                      position={[0, 0.26, 0]}
                      ref={(g) => {
                        if (g) tips.current[i] = g;
                      }}
                    >
                      <Solid geometry={box(0.08, 0.2, 0.08)} materials={materials} position={[0, 0.1, 0]} />
                    </group>
                  </group>
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
    </Anchor>
  );
}
