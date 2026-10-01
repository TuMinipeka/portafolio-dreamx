"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, MathUtils, PointsMaterial, Vector3 } from "three";
import { atmosphere, proximity, waypointY } from "./atmosphere";

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
