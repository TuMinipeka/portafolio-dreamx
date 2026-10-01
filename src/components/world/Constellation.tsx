"use client";

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group, MathUtils, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { stations, tools } from "@/content/flight";
import { atmosphere, proximity } from "./atmosphere";
import { Anchor, cursorDistance, paintLines, reduceMotion, type LineRef } from "./stage";

/* Flight plan: Daniel's tools as a constellation. Each project is a bright star
   linked to the tools it was built with; tools he's learning now sit on the outer
   ring, "en route". Hover any star to light up only its connections. */

// Technologies he's studying now (language-neutral names).
const LEARNING = ["Cloud", "DevOps", "Spring Boot", "AI agents", "WebGL"];

const normalize = (name: string) => name.replace(/\s+\d+$/, "");
const PROJECT_NAMES: Record<string, string> = { apex: "APEX", hub: "Access Hub", tenant: "TENANT" };

type Node = { label: string; kind: "project" | "tool" | "learning"; position: Vector3 };

function buildGraph() {
  const nodes: Node[] = [];
  const edges: [number, number][] = [];

  // Projects on an inner triangle.
  const centers = stations.map((_, i) => {
    const a = (i / stations.length) * Math.PI * 2 + Math.PI / 2;
    return new Vector3(Math.cos(a) * 1.7, Math.sin(a) * 1.35, 0);
  });
  stations.forEach((s, i) => nodes.push({ label: PROJECT_NAMES[s.id], kind: "project", position: centers[i] }));

  // Each tool sits next to the projects that used it: around a single project it fans
  // outward; shared tools land between their projects. Unused-in-projects tools go out wide.
  const names = [...new Set([...stations.flatMap((s) => s.stack), ...tools].map(normalize))];
  const used = names.map((name) => stations.flatMap((s, p) => (s.stack.map(normalize).includes(name) ? [p] : [])));
  const fanCount = stations.map(() => 0);
  const fanTotal = stations.map((_, p) => used.filter((u) => u.length === 1 && u[0] === p).length);
  const free = used.filter((u) => u.length === 0).length;
  let freeIndex = 0;
  const sharedCount: Record<string, number> = {};

  names.forEach((name, i) => {
    const projects = used[i];
    let position: Vector3;
    if (projects.length === 1) {
      const p = projects[0];
      const out = Math.atan2(centers[p].y, centers[p].x);
      const spread = Math.PI * 0.95;
      const k = fanTotal[p] > 1 ? fanCount[p]++ / (fanTotal[p] - 1) : 0.5;
      const a = out - spread / 2 + spread * k;
      position = centers[p].clone().add(new Vector3(Math.cos(a) * 1.25, Math.sin(a) * 0.95, (k - 0.5) * 0.6));
    } else if (projects.length > 1) {
      // Between its projects, stacked across the line that joins them so shared tools don't collide.
      const key = projects.join("-");
      const slot = (sharedCount[key] = (sharedCount[key] ?? -1) + 1);
      const mid = projects.reduce((acc, p) => acc.add(centers[p]), new Vector3()).divideScalar(projects.length);
      const across = new Vector3(
        -(centers[projects[1]].y - centers[projects[0]].y),
        centers[projects[1]].x - centers[projects[0]].x,
        0,
      )
        .normalize()
        .multiplyScalar((slot - 0.5) * 0.7);
      position = mid.multiplyScalar(projects.length === stations.length ? 0 : 1.15).add(across);
    } else {
      const a = (freeIndex++ / free) * Math.PI * 2 + 0.9;
      position = new Vector3(Math.cos(a) * 3.9, Math.sin(a) * 2.7, -0.4);
    }
    nodes.push({ label: name, kind: "tool", position });
    projects.forEach((p) => edges.push([p, nodes.length - 1]));
  });

  // What he's learning, on the outermost ring.
  LEARNING.forEach((label, i) => {
    const a = (i / LEARNING.length) * Math.PI * 2 + 0.25;
    nodes.push({ label, kind: "learning", position: new Vector3(Math.cos(a) * 4.6, Math.sin(a) * 3.2, -0.8) });
  });

  return { nodes, edges };
}

export function Constellation({ index }: { index: number }) {
  const graph = useMemo(() => buildGraph(), []);
  const group = useRef<Group>(null);
  const stars = useRef<(Mesh | null)[]>([]);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const lines = useRef<(LineRef | null)[]>([]);
  const glow = useRef<number[]>(graph.nodes.map(() => 1));
  const still = useMemo(() => reduceMotion(), []);
  const clock = useRef(0);
  const { camera, size, gl } = useThree();
  const projected = useMemo(() => new Vector3(), []);

  // One absolutely positioned layer of plain spans over the canvas (no React roots per label).
  useEffect(() => {
    const host = gl.domElement.parentElement;
    if (!host) return;
    const layer = document.createElement("div");
    layer.className = "pointer-events-none absolute inset-0 overflow-hidden";
    layer.setAttribute("aria-hidden", "true");
    graph.nodes.forEach((node, i) => {
      const span = document.createElement("span");
      span.textContent = node.label;
      span.className = `absolute left-0 top-0 whitespace-nowrap text-(--ink) select-none will-change-transform ${
        node.kind === "project"
          ? "font-display text-step-0 font-semibold [font-variation-settings:'wdth'_110]"
          : node.kind === "learning"
            ? "text-step--1 italic"
            : "text-step--1"
      }`;
      span.style.opacity = "0";
      layer.appendChild(span);
      labels.current[i] = span;
    });
    host.appendChild(layer);
    return () => {
      layer.remove();
      labels.current = [];
    };
  }, [gl, graph]);

  const neighbors = useMemo(() => {
    const map = graph.nodes.map(() => new Set<number>());
    for (const [a, b] of graph.edges) {
      map[a].add(b);
      map[b].add(a);
    }
    return map;
  }, [graph]);

  useFrame((_, delta) => {
    const fade = proximity(index);
    const dt = Math.min(delta, 0.1);
    if (!still) clock.current += dt;
    const g = group.current;
    if (!g) return;
    g.rotation.y = Math.sin(clock.current * 0.15) * 0.35;

    let hovered = -1;
    if (fade > 0.3) {
      let best = 0.05;
      graph.nodes.forEach((node, i) => {
        const d = cursorDistance(node.position, g, camera, size.width / size.height);
        if (d < best) {
          best = d;
          hovered = i;
        }
      });
    }

    graph.nodes.forEach((node, i) => {
      const lit = hovered === -1 || hovered === i || neighbors[hovered].has(i);
      const base = node.kind === "learning" ? 0.55 : 1;
      glow.current[i] = MathUtils.damp(glow.current[i], lit ? base : 0.18, 8, dt);
      const o = fade * glow.current[i];

      const star = stars.current[i];
      if (star) {
        const material = star.material as MeshBasicMaterial;
        material.color.copy(atmosphere.ink);
        material.opacity = o;
        star.scale.setScalar(hovered === i ? 1.6 : 1);
      }
      const label = labels.current[i];
      if (label) {
        label.style.display = fade < 0.02 ? "none" : "";
        if (fade >= 0.02) {
          projected.copy(node.position).applyMatrix4(g.matrixWorld).project(camera);
          const x = (projected.x * 0.5 + 0.5) * size.width;
          const y = (-projected.y * 0.5 + 0.5) * size.height;
          label.style.transform = `translate(-50%, 0) translate(${x.toFixed(1)}px, ${(y + 10).toFixed(1)}px)`;
          label.style.opacity = String(o);
        }
      }
    });

    graph.edges.forEach(([a, b], i) => {
      const lit = hovered === -1 ? 0.35 : hovered === a || hovered === b ? 0.95 : 0.06;
      paintLines([lines.current[i]], lit * fade);
    });
  });

  return (
    <Anchor index={index} tilt={0} follow={0.3}>
      <group ref={group}>
        {graph.edges.map(([a, b], i) => (
          <Line
            key={`e${i}`}
            ref={(l) => {
              lines.current[i] = l;
            }}
            points={[graph.nodes[a].position, graph.nodes[b].position]}
            lineWidth={1}
            transparent
          />
        ))}
        {graph.nodes.map((node, i) => (
          <group key={node.label} position={node.position}>
            <mesh
              ref={(m) => {
                stars.current[i] = m;
              }}
            >
              <sphereGeometry args={[node.kind === "project" ? 0.11 : 0.05, 14, 14]} />
              <meshBasicMaterial transparent />
            </mesh>
          </group>
        ))}
      </group>
    </Anchor>
  );
}
