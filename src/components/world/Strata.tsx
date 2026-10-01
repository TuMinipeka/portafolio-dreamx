"use client";

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, MathUtils, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { atmosphere, proximity } from "./atmosphere";
import { Anchor, cursorDistance, paintLines, reduceMotion, type LineRef } from "./stage";

/* TENANT: a shared core, isolated tenants, data never crossing between them.
   Hover a tenant and only its own path lights up: isolation you can see. */

const TENANTS = 5;
const STRATA = [-0.9, 0, 0.9];

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

export function Strata({ index }: { index: number }) {
  const group = useRef<Group>(null);
  const strataRefs = useRef<(LineRef | null)[]>([]);
  const coreRef = useRef<LineRef>(null);
  const boxRefs = useRef<(LineRef | null)[][]>(Array.from({ length: TENANTS }, () => []));
  const linkRefs = useRef<(LineRef | null)[]>([]);
  const pulseRefs = useRef<(Mesh | null)[]>([]);
  const focus = useRef<number[]>(Array(TENANTS).fill(1));
  const still = useMemo(() => reduceMotion(), []);
  const clock = useRef(0);
  const { camera, size } = useThree();

  const shape = useMemo(() => {
    const islands = Array.from({ length: TENANTS }, (_, i) => {
      const a = (i / TENANTS) * Math.PI * 2 + 0.3;
      return new Vector3(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6);
    });
    return {
      strata: STRATA.map((y) => square(6.4, y)),
      core: [new Vector3(0, -1.3, 0), new Vector3(0, 1.3, 0)],
      islands,
      boxes: islands.map((c) => STRATA.map((y) => square(0.55, y, c.x, c.z))),
      links: islands.map((c) => [new Vector3(0, 0, 0), c]),
    };
  }, []);

  useFrame((_, delta) => {
    const fade = proximity(index);
    const dt = Math.min(delta, 0.1);
    if (!still) clock.current += dt;
    const g = group.current;
    if (!g) return;
    g.rotation.y = clock.current * 0.08;

    // Which tenant is under the cursor (within ~6% of the viewport height)?
    let hovered = -1;
    if (fade > 0.3) {
      let best = 0.06;
      shape.islands.forEach((island, i) => {
        const d = cursorDistance(island, g, camera, size.width / size.height);
        if (d < best) {
          best = d;
          hovered = i;
        }
      });
    }

    paintLines(strataRefs.current, 0.18 * fade);
    paintLines([coreRef.current], 0.8 * fade);
    for (let i = 0; i < TENANTS; i++) {
      const target = hovered === -1 ? 1 : hovered === i ? 1.25 : 0.12;
      focus.current[i] = MathUtils.damp(focus.current[i], target, 8, dt);
      const f = Math.min(1, focus.current[i]);
      paintLines(boxRefs.current[i], 0.7 * fade * f);
      paintLines([linkRefs.current[i]], 0.7 * fade * f);

      const pulse = pulseRefs.current[i];
      if (pulse) {
        // A pulse per tenant: core to island and back. Never island to island.
        const t = (Math.sin(clock.current * 0.9 * focus.current[i] + i * 1.3) + 1) / 2;
        pulse.position.lerpVectors(shape.links[i][0], shape.links[i][1], t);
        pulse.scale.setScalar(focus.current[i]);
        const material = pulse.material as MeshBasicMaterial;
        material.color.copy(atmosphere.ink);
        material.opacity = fade * f;
      }
    }
  });

  return (
    <Anchor index={index} tilt={0.35} follow={0.2}>
      <group ref={group}>
        {shape.strata.map((points, i) => (
          <Line
            key={`s${i}`}
            ref={(l) => {
              strataRefs.current[i] = l;
            }}
            points={points}
            lineWidth={1}
            transparent
          />
        ))}
        <Line ref={coreRef} points={shape.core} lineWidth={2.2} transparent />
        {shape.boxes.map((stack, t) =>
          stack.map((points, s) => (
            <Line
              key={`b${t}-${s}`}
              ref={(l) => {
                boxRefs.current[t][s] = l;
              }}
              points={points}
              lineWidth={1.2}
              transparent
            />
          )),
        )}
        {shape.links.map((points, i) => (
          <Line
            key={`l${i}`}
            ref={(l) => {
              linkRefs.current[i] = l;
            }}
            points={points}
            lineWidth={1}
            transparent
            dashed
            dashSize={0.1}
            gapSize={0.08}
          />
        ))}
        {shape.links.map((_, i) => (
          <mesh
            key={`p${i}`}
            ref={(m) => {
              pulseRefs.current[i] = m;
            }}
          >
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial transparent />
          </mesh>
        ))}
      </group>
    </Anchor>
  );
}
