"use client";

import dynamic from "next/dynamic";

// Three.js only runs in the browser and is heavy, so it loads after the page.
const World = dynamic(() => import("./World"), { ssr: false });

/** Fixed layer behind all content. Appears with the motion stage of the compile. */
export function WorldMount() {
  return (
    <div data-chrome aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <World />
    </div>
  );
}
