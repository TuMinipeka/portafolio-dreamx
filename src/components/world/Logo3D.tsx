"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ExtrudeGeometry, Group, MathUtils, MeshStandardMaterial } from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { atmosphere, proximity } from "./atmosphere";
import { Anchor, reduceMotion } from "./stage";

/* Kármán line: the DREAMX "D" mark extruded into a solid, lit object that floats
   among the stars and turns toward the cursor. Same three paths as the 2D mark. */

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="400 345 452 345">
<path d="M412 350 L705 350 C790 350 848 420 848 515 C848 575 822 615 787 640 L735 590 C760 572 773 545 773 515 C773 462 738 425 690 425 L522 425 Z"/>
<path d="M573 465 L630 450 L600 492 L405 645 Z"/>
<path d="M428 683 L628 522 L795 683 L705 685 L630 588 L535 685 Z"/>
</svg>`;

export function Logo3D({ index }: { index: number }) {
  const group = useRef<Group>(null);
  const clock = useRef(0);
  const still = useMemo(() => reduceMotion(), []);

  const { geometry, material } = useMemo(() => {
    const shapes = new SVGLoader().parse(MARK).paths.flatMap((p) => SVGLoader.createShapes(p));
    const geometry = new ExtrudeGeometry(shapes, {
      depth: 60,
      bevelEnabled: true,
      bevelThickness: 8,
      bevelSize: 5,
      bevelSegments: 4,
      curveSegments: 24,
    });
    geometry.center();
    // SVG units to world units, with y flipped (SVG grows downward).
    geometry.scale(0.0072, -0.0072, 0.0072);
    geometry.computeVertexNormals();
    const material = new MeshStandardMaterial({
      color: "#f3f5f6",
      metalness: 0.75,
      roughness: 0.28,
      transparent: true,
    });
    return { geometry, material };
  }, []);

  useFrame((_, delta) => {
    const fade = proximity(index, 1.2);
    const dt = Math.min(delta, 0.1);
    if (!still) clock.current += dt;
    material.opacity = fade;
    material.visible = fade > 0.01;
    const g = group.current;
    if (!g) return;
    g.position.y = Math.sin(clock.current * 0.9) * 0.12;
    g.rotation.y = MathUtils.damp(g.rotation.y, atmosphere.pointer.x * 0.7 + Math.sin(clock.current * 0.3) * 0.25, 3, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, -atmosphere.pointer.y * 0.35, 3, dt);
  });

  return (
    <Anchor index={index} tilt={0} follow={0}>
      <group ref={group}>
        <mesh geometry={geometry} material={material} />
      </group>
      <directionalLight position={[3, 4, 6]} intensity={2.4} />
      <directionalLight position={[-4, -2, 3]} intensity={0.6} color="#9fb4d8" />
      <pointLight position={[0, 0, 4]} intensity={6} distance={10} />
    </Anchor>
  );
}
