"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  Camera,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  Vector3,
} from "three";
import type { Line2, LineSegments2 } from "three-stdlib";
import { atmosphere, waypointY } from "./atmosphere";

export type LineRef = Line2 | LineSegments2;

/** Keeps a set of drei lines in the scene's ink color at a given opacity. */
export function paintLines(lines: (LineRef | null)[], opacity: number) {
  for (const line of lines) {
    if (!line) continue;
    line.material.color.copy(atmosphere.ink);
    line.material.opacity = opacity;
  }
}

export const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Anchors a station's object in the sky: centered where the camera looks when that
 * section is on screen, in the right-hand "stage" column. With `follow`, the object
 * turns a little toward the cursor, like an instrument you can lean in to read.
 */
export function Anchor({
  index,
  children,
  tilt = 0.55,
  follow = 0.35,
}: {
  index: number;
  children: ReactNode;
  tilt?: number;
  follow?: number;
}) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    g.position.x = MathUtils.damp(g.position.x, atmosphere.stageX, 4, dt);
    g.rotation.y = MathUtils.damp(g.rotation.y, atmosphere.pointer.x * follow, 4, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, tilt - atmosphere.pointer.y * follow * 0.4, 4, dt);
  });

  return (
    <group ref={group} position={[0, waypointY(index) + 1.2 - 4.2, -6]} rotation={[tilt, 0, 0]}>
      {children}
    </group>
  );
}

/**
 * The look shared by every solid model: a faint fill in the sky's color and crisp
 * edges in ink, so models read as technical drawings that happen to be 3D.
 */
export function useSolidMaterials() {
  return useMemo(
    () => ({
      fill: new MeshBasicMaterial({ transparent: true, depthWrite: true }),
      edge: new LineBasicMaterial({ transparent: true }),
      paint(opacity: number) {
        this.fill.color.copy(atmosphere.sky).lerp(atmosphere.ink, 0.12);
        this.fill.opacity = opacity * 0.92;
        this.fill.visible = opacity > 0.01;
        this.edge.color.copy(atmosphere.ink);
        this.edge.opacity = opacity;
        this.edge.visible = opacity > 0.01;
      },
    }),
    [],
  );
}

const edgeCache = new WeakMap<BufferGeometry, EdgesGeometry>();

/** A mesh drawn as fill + edges. */
export function Solid({
  geometry,
  materials,
  position,
  rotation,
}: {
  geometry: BufferGeometry;
  materials: ReturnType<typeof useSolidMaterials>;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  let edges = edgeCache.get(geometry);
  if (!edges) {
    edges = new EdgesGeometry(geometry, 20);
    edgeCache.set(geometry, edges);
  }
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} material={materials.fill} />
      <lineSegments geometry={edges} material={materials.edge} />
    </group>
  );
}

const boxes = new Map<string, BoxGeometry>();
/** Shared box geometry by size, so repeated parts don't allocate twice. */
export function box(w: number, h: number, d: number) {
  const key = `${w}:${h}:${d}`;
  let geometry = boxes.get(key);
  if (!geometry) {
    geometry = new BoxGeometry(w, h, d);
    boxes.set(key, geometry);
  }
  return geometry;
}

const projected = new Vector3();
/**
 * Screen distance (in viewport heights) between the cursor and a point in an
 * object's local space. Used for hover without the canvas taking pointer events.
 */
export function cursorDistance(local: Vector3, object: Group, camera: Camera, aspect: number) {
  projected.copy(local).applyMatrix4(object.matrixWorld).project(camera);
  const dx = (projected.x - atmosphere.pointer.x) * aspect;
  const dy = projected.y - atmosphere.pointer.y;
  return Math.hypot(dx, dy) / 2;
}
