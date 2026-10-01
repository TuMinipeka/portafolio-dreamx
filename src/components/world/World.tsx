"use client";

import { Canvas } from "@react-three/fiber";
import { flight } from "@/content/flight";
import { Rig } from "./Rig";
import { Runway } from "./Runway";
import { Attendance } from "./Attendance";
import { Circuit } from "./Circuit";
import { Constellation } from "./Constellation";
import { Logo3D } from "./Logo3D";
import { RobotArm } from "./RobotArm";
import { Stars } from "./Stars";
import { Strata } from "./Strata";

const at = (id: (typeof flight)[number]["id"]) => flight.findIndex((w) => w.id === id);

// Checked once: no WebGL means the page simply stays 2D. Everything still works.
const supportsWebGL = (() => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
})();

/**
 * The continuous world behind the page. One canvas for the whole site, transparent
 * so the CSS sky shows through; fog takes the same sky color so depth reads as air.
 */
export default function World() {
  if (!supportsWebGL) return null;
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 40, near: 0.1, far: 200, position: [0, 1.2, 8] }}
      style={{ pointerEvents: "none" }}
    >
      <Rig />
      <ambientLight intensity={0.5} />
      <Runway />
      <RobotArm index={at("log")} />
      <Constellation index={at("about")} />
      <Circuit index={at("apex")} />
      <Attendance index={at("hub")} />
      <Strata index={at("tenant")} />
      <Stars index={at("contact")} />
      <Logo3D index={at("contact")} />
    </Canvas>
  );
}
