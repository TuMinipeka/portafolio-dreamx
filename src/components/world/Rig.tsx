"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Fog, MathUtils, Vector3 } from "three";
import { useFlight } from "@/store/flight";
import { atmosphere, sampleAtmosphere, SEGMENTS, GAP } from "./atmosphere";

const PITCH = 0.3; // radians the camera looks down: we watch the ground fall away
const target = new Vector3();

/**
 * Camera and atmosphere. Runs before every other frame callback (priority -1)
 * so objects read up-to-date colors. Scroll progress is damped here, which is
 * what makes the climb feel like flight rather than a page scrolling.
 */
export function Rig() {
  const { camera, scene } = useThree();

  useEffect(() => {
    scene.fog = new Fog(atmosphere.sky, 10, 42);
    if (process.env.NODE_ENV === "development") Object.assign(window, { __world: { atmosphere, camera } });
  }, [scene, camera]);

  useFrame((_, delta) => {
    const goal = useFlight.getState().progress;
    const progress = MathUtils.damp(atmosphere.progress, goal, 4, Math.min(delta, 0.5));
    sampleAtmosphere(progress);

    const y = progress * SEGMENTS * GAP + 1.2;
    camera.position.set(0, y, 8);
    target.set(0, y - Math.tan(PITCH) * 14, -6);
    camera.lookAt(target);

    if (scene.fog) (scene.fog as Fog).color.copy(atmosphere.sky);
  }, -1);

  return null;
}
