"use client";

import { gsap } from "gsap";
import { flight, type StationId } from "@/content/flight";
import { PROJECT_NOTE, sound } from "@/lib/sound";
import { useFlight } from "@/store/flight";

/**
 * Project transitions: the page re-orders itself instead of cutting to the next one.
 *
 *   0 – 250 ms   The current content "decompiles" by role, the 12-column scaffold
 *                draws in, the 3D instrument starts coming apart. Exit note + clicks.
 *   250 – 700    Only the project title travels (a ghost copy), the altimeter counts
 *                to the new altitude while the camera climbs and the sky changes. Wind.
 *   700 – 1200   The new project compiles in reading order, the scaffold leaves,
 *                the instrument re-forms. Layout thud, arrival note, project texture.
 *
 * Interruptible (a second request finishes the first instantly), ≤ 1.2 s, and reduced
 * to a short fade when the visitor prefers reduced motion.
 */

type Router = { push: (href: string) => void; prefetch: (href: string) => void };

const EXIT = 0.25;
const TRAVEL = 0.45;
const ENTER = 0.5;

let run = 0;
let live: gsap.core.Animation[] = [];

const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const waypoint = (id: StationId | null) => flight.find((w) => w.id === (id ?? "hero"))!;
const progressOf = (id: StationId) => flight.findIndex((w) => w.id === id) / (flight.length - 1);

function inView(el: Element) {
  const r = el.getBoundingClientRect();
  return r.bottom > -40 && r.top < window.innerHeight + 40 && r.width > 0;
}

/** Which project the visitor is looking at right now, if any. */
function currentStation(): StationId | null {
  const parked = document.querySelector<HTMLElement>("[data-station-page]")?.dataset.stationPage;
  if (parked && parked !== "hero") return parked as StationId;
  const middle = window.innerHeight / 2;
  for (const id of ["apex", "hub", "tenant"] as StationId[]) {
    const r = document.getElementById(id)?.getBoundingClientRect();
    if (r && r.top < middle && r.bottom > middle) return id;
  }
  return null;
}

function track<T extends gsap.core.Animation>(a: T) {
  live.push(a);
  return a;
}

/** Wait (up to ~1.5 s) for the destination page to be in the DOM. */
async function arrival(to: StationId, id: number) {
  for (let i = 0; i < 90; i++) {
    if (id !== run) return null;
    const page = document.querySelector<HTMLElement>(`[data-station-page="${to}"]`);
    if (page) return page;
    // setTimeout, not rAF: keeps polling even if the tab is in the background.
    await sleep(0.016);
  }
  return null;
}

function scaffold(show: boolean) {
  const columns = document.querySelectorAll<HTMLElement>("#transition-scaffold > span");
  return track(
    gsap.to(columns, {
      scaleY: show ? 1 : 0,
      transformOrigin: show ? "top" : "bottom",
      duration: show ? 0.22 : 0.3,
      stagger: 0.015,
      ease: show ? "power2.out" : "power2.in",
    }),
  );
}

/** Builds the travelling copy of the current title. */
function makeGhost(source: HTMLElement | null) {
  const layer = document.getElementById("transition-ghost");
  if (!source || !layer) return null;
  const rect = source.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("id");
  ghost.removeAttribute("data-shared-title");
  const style = getComputedStyle(source);
  Object.assign(ghost.style, {
    position: "absolute",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    margin: "0",
    transformOrigin: "0 0",
    color: style.color,
    fontVariationSettings: style.fontVariationSettings,
  });
  layer.appendChild(ghost);
  source.style.visibility = "hidden";
  return { ghost, rect, width: style.fontVariationSettings };
}

function cleanup() {
  for (const a of live) a.kill();
  live = [];
  const root = document.documentElement;
  delete root.dataset.transition;
  document.getElementById("transition-ghost")?.replaceChildren();
  gsap.set("#transition-scaffold > span", { scaleY: 0 });
}

/** Navigate to a project's case study through the re-ordering transition. */
export async function goToProject(router: Router, href: string, to: StationId) {
  // A second request while one is running: finish the first right away.
  if (run && document.documentElement.dataset.transition) cleanup();
  const id = ++run;
  const root = document.documentElement;
  const from = currentStation();
  const flightState = useFlight.getState();
  const target = waypoint(to);

  if (reduced()) {
    const main = document.getElementById("main");
    if (main) await gsap.to(main, { opacity: 0, duration: 0.15 });
    router.push(href);
    await arrival(to, id);
    if (main) gsap.to(main, { opacity: 1, duration: 0.2 });
    finish(to, id);
    return;
  }

  router.prefetch(href);
  flightState.setTransition({ from, to, start: performance.now() });
  root.dataset.transition = "leaving";

  /* ---------- Act 1: decompile (0 – 250 ms) ---------- */
  const audio = sound.engine;
  audio?.note(PROJECT_NOTE[from ?? "ground"], 0.05);
  audio?.scaffold();
  scaffold(true);

  const scope = document.getElementById("main") ?? document.body;
  const shared =
    (from &&
      document.querySelector<HTMLElement>(`#${from} [data-shared-title], [data-station-page] [data-shared-title]`)) ||
    null;
  const ghost = makeGhost(shared && inView(shared) ? shared : null);

  const leaving = [...scope.querySelectorAll<HTMLElement>("[data-exit]")].filter(inView);
  const byRole = (role: string) => leaving.filter((el) => el.dataset.exit === role);
  track(
    gsap.to(byRole("text").reverse(), {
      clipPath: "inset(0 0 100% 0)",
      yPercent: -8,
      opacity: 0,
      duration: EXIT,
      stagger: 0.02,
      ease: "power2.in",
    }),
  );
  track(
    gsap.to(byRole("title"), { opacity: 0, scaleX: 0.6, transformOrigin: "0 50%", duration: EXIT, ease: "power2.in" }),
  );
  track(
    gsap.to(byRole("media"), {
      clipPath: "inset(12% 8% 12% 8%)",
      opacity: 0,
      scale: 0.96,
      duration: EXIT,
      ease: "power2.in",
    }),
  );

  await sleep(EXIT * 0.8);
  if (id !== run) return;

  /* ---------- Act 2: travel (250 – 700 ms) ---------- */
  root.dataset.transition = "pending";
  router.push(href);

  const up = progressOf(to) >= flightState.progress;
  audio?.sweep(up);

  // Camera and sky: the climb. The altimeter counts like a mechanical drum.
  const counter = { altitude: flightState.altitude };
  useFlight.getState().setFlight({ altitude: counter.altitude, layer: flightState.layer, progress: progressOf(to) });
  track(
    gsap.to(counter, {
      altitude: target.altitude,
      duration: TRAVEL,
      ease: "power2.inOut",
      onUpdate: () =>
        useFlight.getState().setFlight({ altitude: counter.altitude, layer: target.layer, progress: progressOf(to) }),
    }),
  );
  track(gsap.to(root, { "--sky": target.sky, duration: TRAVEL, ease: "power2.inOut" }));
  track(
    gsap.delayedCall(TRAVEL / 2, () =>
      root.style.setProperty("--ink", target.dark ? "var(--color-cloud)" : "var(--color-graphite)"),
    ),
  );

  const page = await arrival(to, id);
  if (id !== run) return;
  const title = page?.querySelector<HTMLElement>("[data-shared-title]") ?? null;

  if (ghost && title) {
    // Fly the ghost onto the new title. If the project changed, the name condenses
    // to a line mid-flight, swaps, and widens back to the new project's cut.
    const end = title.getBoundingClientRect();
    const endStyle = getComputedStyle(title);
    const scale = end.height / ghost.rect.height;
    const renamed = ghost.ghost.textContent !== title.textContent;
    const flightTime = Math.max(0.3, TRAVEL - EXIT * 0.2);
    track(
      gsap.to(ghost.ghost, {
        x: end.left - ghost.rect.left,
        y: end.top - ghost.rect.top,
        scale,
        color: endStyle.color,
        duration: flightTime,
        ease: "power3.inOut",
      }),
    );
    if (renamed) {
      track(
        gsap
          .timeline()
          .to(ghost.ghost, {
            fontVariationSettings: "'wdth' 50",
            opacity: 0.4,
            duration: flightTime / 2,
            ease: "power2.in",
          })
          .add(() => {
            ghost.ghost.textContent = title.textContent;
          })
          .to(ghost.ghost, {
            fontVariationSettings: endStyle.fontVariationSettings,
            opacity: 1,
            duration: flightTime / 2,
            ease: "power2.out",
          }),
      );
    }
    await sleep(flightTime);
  } else {
    await sleep(TRAVEL - EXIT * 0.2);
  }
  if (id !== run) return;

  /* ---------- Act 3: compile in (700 – 1200 ms) ---------- */
  audio?.thud();
  audio?.note(PROJECT_NOTE[to], 0.07, 0.04);
  audio?.texture(to);

  const entering = page ? [...page.querySelectorAll<HTMLElement>("[data-exit]")].filter(inView) : [];
  const enteringRole = (role: string) => entering.filter((el) => el.dataset.exit === role);
  track(
    gsap.from(enteringRole("text"), {
      clipPath: "inset(0 0 100% 0)",
      yPercent: 10,
      opacity: 0,
      duration: ENTER * 0.8,
      stagger: 0.035,
      ease: "power3.out",
      clearProps: "clipPath,transform,opacity",
    }),
  );
  track(
    gsap.from(enteringRole("title"), {
      opacity: 0,
      scaleX: 0.6,
      transformOrigin: "0 50%",
      duration: ENTER * 0.7,
      ease: "power3.out",
      clearProps: "transform,opacity",
    }),
  );
  track(
    gsap.from(enteringRole("media"), {
      clipPath: "inset(50% 0 50% 0)",
      duration: ENTER,
      ease: "power3.inOut",
      clearProps: "clipPath",
    }),
  );
  if (title && !ghost) {
    track(
      gsap.from(title, {
        opacity: 0,
        scaleX: 0.6,
        transformOrigin: "0 50%",
        duration: ENTER * 0.7,
        ease: "power3.out",
        clearProps: "transform,opacity",
      }),
    );
  }
  delete root.dataset.transition;
  if (title) title.style.visibility = "";
  document.getElementById("transition-ghost")?.replaceChildren();
  scaffold(false);

  await sleep(ENTER);
  if (id !== run) return;
  finish(to, id);
}

function finish(to: StationId, id: number) {
  if (id !== run) return;
  const root = document.documentElement;
  const target = waypoint(to);
  delete root.dataset.transition;
  root.style.setProperty("--sky", target.sky);
  root.style.setProperty("--ink", target.dark ? "var(--color-cloud)" : "var(--color-graphite)");
  root.dataset.sky = target.dark ? "dark" : "light";
  useFlight.getState().setFlight({ altitude: target.altitude, layer: target.layer, progress: progressOf(to) });
  useFlight.getState().setTransition(null);

  const title = document.querySelector<HTMLElement>("[data-station-page] [data-shared-title]");
  title?.focus({ preventScroll: true });
  const status = document.getElementById("transition-status");
  if (status && title) status.textContent = `${status.dataset.arrived ?? ""} ${title.textContent}`;
  if (window.matchMedia("(pointer: coarse)").matches) navigator.vibrate?.(12);
  live = [];
}
