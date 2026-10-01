"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { flight, stations, type StationId } from "@/content/flight";
import type { Locale } from "@/i18n/config";
import { ProjectLink } from "./ProjectLink";
import { goToProject } from "./orchestrator";

const formatAltitude = (m: number) => (m < 1000 ? `${m} m` : `${m / 1000} km`);

/**
 * On a case study: the three stations as a small rail ordered by altitude.
 * ← / → (or a horizontal swipe on touch screens) moves to the previous / next project.
 */
export function StationRail({
  lang,
  current,
  names,
  label,
}: {
  lang: Locale;
  current: StationId;
  names: Record<StationId, string>;
  label: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const index = stations.findIndex((s) => s.id === current);
    const go = (step: number) => {
      const next = stations[(index + step + stations.length) % stations.length].id;
      goToProject(router, `/${lang}/work/${next}`, next);
    };

    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const typing = target?.closest("input, textarea, [contenteditable], [cmdk-root], [role=dialog]");
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };

    let startX = 0;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 80 && Math.abs(dy) < 50) go(dx < 0 ? 1 : -1);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [current, lang, router]);

  return (
    <nav aria-label={label}>
      <ol className="flex gap-5 text-step--1">
        {stations.map((s) => {
          const here = s.id === current;
          return (
            <li key={s.id}>
              <ProjectLink
                href={`/${lang}/work/${s.id}`}
                station={s.id}
                aria-current={here ? "page" : undefined}
                className={`flex flex-col ${here ? "" : "opacity-70 hover:opacity-100"}`}
              >
                <span className={here ? "font-medium underline decoration-1 underline-offset-4" : ""}>
                  {names[s.id]}
                </span>
                <span className="tabular opacity-80">
                  {formatAltitude(flight.find((w) => w.id === s.id)!.altitude)}
                </span>
              </ProjectLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
