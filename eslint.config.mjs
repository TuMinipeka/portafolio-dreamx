import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The 3D scene is imperative by design: React Three Fiber mutates Three.js
    // objects (materials, positions) inside useFrame on every frame, which the
    // React Compiler purity rules can't model.
    files: ["src/components/world/**"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local tooling folders (untracked), not app code:
    ".agents/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
