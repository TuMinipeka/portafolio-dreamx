"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Fog, MathUtils, Vector3 } from "three";
import { useFlight } from "@/store/flight";
import { atmosphere, sampleAtmosphere, SEGMENTS, GAP } from "./atmosphere";

const PITCH = 0.3; // radians the camera looks down: we watch the ground fall away
const DISTANCE = 14; // camera to the plane where station objects stand
const target = new Vector3();
const rawPointer = { x: 0, y: 0 };

/**
 * Camera and atmosphere. Runs before every other frame callback (priority -1)
 * so objects read up-to-date colors. Scroll progress is damped here, which is
 * what makes the climb feel like flight rather than a page scrolling.
 */
export function Rig() {
  const { camera, scene } = useThree();

  useEffect(() => {
    const move = (e: PointerEvent) => {
      rawPointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      rawPointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const down = () => (atmosphere.pressed = true);
    const up = () => (atmosphere.pressed = false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  useEffect(() => {
    scene.fog = new Fog(atmosphere.sky, 10, 42);
    if (process.env.NODE_ENV === "development") Object.assign(window, { __world: { atmosphere, camera } });
  }, [scene, camera]);

  useFrame(({ size }, delta) => {
    const { progress: goal, presence } = useFlight.getState();
    const dt = Math.min(delta, 0.5);
    const progress = MathUtils.damp(atmosphere.progress, goal, 4, dt);
    atmosphere.presence = MathUtils.damp(atmosphere.presence, presence, 5, dt);
    sampleAtmosphere(progress);

    const y = progress * SEGMENTS * GAP + 1.2;
    camera.position.set(0, y, 8);
    target.set(0, y - Math.tan(PITCH) * DISTANCE, -6);
    camera.lookAt(target);

    if (scene.fog) (scene.fog as Fog).color.copy(atmosphere.sky);

    atmosphere.pointer.x = MathUtils.damp(atmosphere.pointer.x, rawPointer.x, 6, dt);
    atmosphere.pointer.y = MathUtils.damp(atmosphere.pointer.y, rawPointer.y, 6, dt);

    // The layout puts text on the left and an "instrument" on the right on wide screens.
    // Station objects stand at the center of that right column; on phones they sit behind the text.
    const aspect = size.width / size.height;
    const halfWidth = Math.tan(MathUtils.degToRad(20)) * DISTANCE * aspect;
    atmosphere.stageX = size.width >= 768 && aspect > 1.1 ? halfWidth * 0.33 : 0;
  }, -1);

  return null;
}
