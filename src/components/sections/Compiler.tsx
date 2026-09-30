"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Dictionary } from "@/i18n/dictionaries";
import { useFlight } from "@/store/flight";

gsap.registerPlugin(Flip, ScrollTrigger);

const TOKENS = ["layout", "type", "color", "motion"] as const;

// Scroll progress through the hero track at which each stage is built.
// Stage 0 (raw HTML) holds for the first stretch so it reads as intentional.
const THRESHOLDS = [0.1, 0.3, 0.5, 0.7];
const stageFor = (progress: number) => THRESHOLDS.filter((t) => progress >= t).length;

/**
 * Drives the compile sequence: as the visitor scrolls the hero track, <html>
 * gains one build token per stage and the b-* variants in the markup switch on.
 * Layout changes are animated with GSAP Flip so elements glide into the grid.
 * Also renders the build log with a way to skip straight to the finished page.
 */
export function Compiler({ copy }: { copy: Dictionary["compile"] }) {
  const stage = useFlight((s) => s.stage);

  useEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute("data-locked")) {
      useFlight.getState().setStage(TOKENS.length);
      return;
    }

    let current = -1;
    const apply = (next: number) => {
      if (next === current) return;
      const layoutFlips = (current < 1) !== (next < 1) && current !== -1;
      const state = layoutFlips ? Flip.getState("[data-flip]") : null;

      root.dataset.build = TOKENS.slice(0, next).join(" ");
      current = next;
      useFlight.getState().setStage(next);

      if (state) Flip.from(state, { duration: 0.9, ease: "expo.out" });
    };

    const trigger = ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => apply(stageFor(self.progress)),
    });
    apply(stageFor(trigger.progress));

    return () => trigger.kill();
  }, []);

  const skip = () => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const end = hero.offsetTop + hero.offsetHeight - window.innerHeight;
    const lenis = useFlight.getState().lenis;
    if (lenis) lenis.scrollTo(end, { duration: 1.6 });
    else window.scrollTo({ top: end });
  };

  return (
    <div
      data-compile-ui
      className="absolute right-4 bottom-4 z-10 w-[min(24rem,calc(100%-2rem))] border border-black bg-white p-4 font-mono text-[13px] leading-relaxed text-black md:right-8 md:bottom-8"
    >
      <p className="font-bold">{copy.title}</p>

      <ol aria-hidden className="mt-2">
        {copy.steps.map((step, i) => {
          const done = i <= stage;
          const next = i === stage + 1;
          return (
            <li key={step} className={done ? "" : next ? "opacity-70" : "opacity-35"}>
              <span className="inline-block w-5">{done ? "✓" : next ? "›" : "·"}</span>
              {step}
            </li>
          );
        })}
      </ol>

      <div aria-hidden className="mt-3 h-px bg-black/15">
        <div
          className="h-px bg-black transition-[width] duration-500"
          style={{ width: `${(stage / TOKENS.length) * 100}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <p>{copy.hint}</p>
        <button type="button" onClick={skip} className="shrink-0 underline underline-offset-2">
          {copy.skip}
        </button>
      </div>
    </div>
  );
}
