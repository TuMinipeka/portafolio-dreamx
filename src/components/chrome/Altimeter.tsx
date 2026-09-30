"use client";

import { flight, type LayerKey } from "@/content/flight";
import type { Locale } from "@/i18n/config";
import { useFlight } from "@/store/flight";

function formatAltitude(meters: number, locale: Locale) {
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} m`;
  }
  const km = meters / 1000;
  const digits = km < 10 ? 1 : 0;
  return `${km.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits })} km`;
}

/**
 * Fixed instrument on the right edge: current altitude, the atmospheric
 * layer we're in, and a vertical scale with a tick per waypoint.
 * Purely visual; the sections themselves carry the headings for assistive tech.
 */
export function Altimeter({ locale, layers }: { locale: Locale; layers: Record<LayerKey, string> }) {
  const altitude = useFlight((s) => s.altitude);
  const layer = useFlight((s) => s.layer);
  const progress = useFlight((s) => s.progress);

  return (
    <div
      aria-hidden
      data-chrome
      className="pointer-events-none fixed right-4 bottom-4 z-40 flex items-end gap-3 text-(--ink) md:top-1/2 md:right-6 md:bottom-auto md:-translate-y-1/2 md:items-center"
    >
      <div className="text-right">
        <p className="tabular font-display text-step-1 leading-none [font-variation-settings:'wdth'_112] md:text-step-2">
          {formatAltitude(altitude, locale)}
        </p>
        <p className="mt-1 text-step--1 opacity-70">{layers[layer]}</p>
      </div>

      <div className="relative hidden h-[40vh] w-3 md:block">
        <span className="absolute inset-y-0 right-0 w-px bg-current opacity-30" />
        {flight.map((w, i) => (
          <span
            key={w.id}
            className="absolute right-0 h-px w-2 bg-current opacity-60"
            style={{ bottom: `${(i / (flight.length - 1)) * 100}%` }}
          />
        ))}
        <span
          className="absolute -right-0.5 h-0.5 w-3 bg-(--color-runway)"
          style={{ bottom: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
