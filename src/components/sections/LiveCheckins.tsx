"use client";

import { useLive } from "@/store/live";

/** Check-ins counted by the 3D crowd at the Hub station, as they happen. */
export function LiveCheckins({ label }: { label: string }) {
  const checkins = useLive((s) => s.checkins);
  return (
    <p aria-hidden className="flex items-baseline gap-3">
      <span className="tabular font-display text-step-3 leading-none font-light [font-variation-settings:'wdth'_120]">
        {checkins.toString().padStart(4, "0")}
      </span>
      <span className="text-step--1 opacity-80">{label}</span>
    </p>
  );
}
