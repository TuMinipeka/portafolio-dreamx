"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Dictionary } from "@/i18n/dictionaries";
import { useFlight } from "@/store/flight";

gsap.registerPlugin(Flip, ScrollTrigger);

const TOKENS = ["layout", "type", "color", "motion"] as const;

// A stage switches on halfway into its segment of --build, so the continuous
// effects of that stage (grid drawing, paint washing in) are already moving.
const stageFor = (build: number) => [0.5, 1.5, 2.5, 3.5].filter((t) => build >= t).length;

/**
 * Drives the compile sequence in two layers:
 *  - Continuous: scroll through the hero track is smoothed into --build (0 to 4).
 *    CSS derives the grid drawing and the paint wash from it, so nothing jumps.
 *  - Discrete: font and layout can't be interpolated, so when a stage switches on
 *    the change is animated in time instead (Flip cascade, words coming into focus).
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
    let flip: gsap.core.Timeline | null = null;

    const apply = (next: number) => {
      if (next === current) return;
      const prev = current;
      current = next;
      const had = (n: number) => prev >= n;
      const has = (n: number) => next >= n;
      const first = prev === -1;

      const layoutChanged = !first && had(1) !== has(1);
      const typeChanged = !first && had(2) !== has(2);
      const motionOn = !first && !had(4) && has(4);

      flip?.progress(1);
      const state = layoutChanged || typeChanged ? Flip.getState("[data-flip]") : null;

      root.dataset.build = TOKENS.slice(0, next).join(" ");
      useFlight.getState().setStage(next);

      if (state) {
        // Blocks glide to their new place one after another, like a layout reflowing.
        flip = Flip.from(state, {
          duration: 1.1,
          ease: "power3.inOut",
          stagger: 0.05,
          nested: true,
        });
      }

      if (typeChanged) {
        // New type is set word by word, focusing in from a blur.
        gsap.fromTo(
          "[data-word]",
          { opacity: 0, yPercent: 35, filter: "blur(10px)" },
          {
            opacity: 1,
            yPercent: 0,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.04,
            clearProps: "filter,transform",
          },
        );
      }

      if (motionOn) {
        // The logo assembles piece by piece as the site chrome arrives.
        gsap.fromTo(
          "header [data-part]",
          { opacity: 0, yPercent: 40 },
          { opacity: 1, yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, delay: 0.2 },
        );
      }
    };

    // Start unbuilt *before* the trigger exists: when the page loads already scrolled past
    // the hero, creating the trigger applies the full build right away and must not be undone.
    apply(0);

    // Smoothed build progress: scrub lag turns scroll steps into a glide.
    const proxy = { build: 0 };
    const tween = gsap.to(proxy, {
      build: TOKENS.length,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.9,
      },
      onUpdate: () => {
        root.style.setProperty("--build", proxy.build.toFixed(3));
        apply(stageFor(proxy.build));
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      flip?.kill();
    };
  }, []);

  const skip = () => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const end = hero.offsetTop + hero.offsetHeight - window.innerHeight;
    const lenis = useFlight.getState().lenis;
    if (lenis) lenis.scrollTo(end, { duration: 2.4 });
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
            <li
              key={step}
              className={`transition-opacity duration-500 ${done ? "" : next ? "opacity-70" : "opacity-35"}`}
            >
              <span className="inline-block w-5">{done ? "✓" : next ? "›" : "·"}</span>
              {step}
            </li>
          );
        })}
      </ol>

      <div aria-hidden className="mt-3 h-px bg-black/15">
        <div className="h-px bg-black" style={{ width: "calc(var(--build) / 4 * 100%)" }} />
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
