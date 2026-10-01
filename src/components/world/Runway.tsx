"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  MathUtils,
  PlaneGeometry,
  PointsMaterial,
  ShaderMaterial,
} from "three";
import { atmosphere, SEGMENTS } from "./atmosphere";

const WIDTH = 12; // the page's 12 columns, one unit each
const LENGTH = 70;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Draws the page's layout grid: 12 columns across, square cells along the length.
// fwidth keeps lines one pixel wide at any distance; they fade toward the horizon.
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform vec2 uCells;
  varying vec2 vUv;

  float lines(vec2 coord) {
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    return 1.0 - min(min(grid.x, grid.y), 1.0);
  }

  void main() {
    float grid = lines(vUv * uCells);
    // Solid outer edges, like the border of the sheet of paper.
    vec2 edge = min(vUv, 1.0 - vUv) * uCells / fwidth(vUv * uCells);
    float border = 1.0 - min(edge.x, 1.0);
    float horizon = 1.0 - smoothstep(0.35, 1.0, vUv.y);
    float alpha = max(grid * 0.55, border) * horizon * uOpacity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/**
 * The fold. The finished page's layout grid starts upright behind the hero,
 * then lies down as we leave the ground and becomes the runway we take off from.
 * Runway lights sit on its edges and fold with it.
 */
export function Runway() {
  const hinge = useRef<Group>(null);

  const sheet = useMemo(() => {
    const geometry = new PlaneGeometry(WIDTH, LENGTH, 1, 1);
    geometry.translate(0, LENGTH / 2, 0); // hinge on the bottom edge
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new Color() },
        uOpacity: { value: 0 },
        uCells: { value: [WIDTH, LENGTH] },
      },
    });
    return { geometry, material };
  }, []);

  const lights = useMemo(() => {
    const positions: number[] = [];
    for (let y = 1; y < LENGTH * 0.6; y += 1.5) {
      positions.push(-WIDTH / 2 - 0.4, y, 0.02, WIDTH / 2 + 0.4, y, 0.02);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: "#ffb000",
      size: 0.14,
      transparent: true,
      depthWrite: false,
    });
    return { geometry, material };
  }, []);

  useFrame(({ clock }) => {
    // The fold happens across the first leg of the flight: ground to runway.
    const fold = MathUtils.smoothstep(atmosphere.progress * SEGMENTS, 0, 1);
    if (hinge.current) hinge.current.rotation.x = -fold * (Math.PI / 2);

    const fadeOut = (1 - MathUtils.smoothstep(atmosphere.progress * SEGMENTS, 1.6, 2.4)) * atmosphere.presence;
    const uniforms = sheet.material.uniforms;
    uniforms.uColor.value.copy(atmosphere.ink);
    uniforms.uOpacity.value = MathUtils.smoothstep(fold, 0, 0.35) * 0.6 * fadeOut;

    // Lights come on once the sheet is down, pulsing gently in sequence.
    const on = MathUtils.smoothstep(fold, 0.7, 1) * fadeOut;
    lights.material.opacity = on * (0.75 + 0.25 * Math.sin(clock.elapsedTime * 3));
  });

  return (
    <group ref={hinge} position={[0, 0, -4]}>
      <mesh geometry={sheet.geometry} material={sheet.material} />
      <points geometry={lights.geometry} material={lights.material} />
    </group>
  );
}
