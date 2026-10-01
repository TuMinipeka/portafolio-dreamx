# DREAMX portfolio: architecture

Portfolio of **Daniel Santiago Mayorga Tellez** (junior software developer, brand **DREAMX**:
"Disciplina · Enfoque · Resultados"). Bilingual (Spanish / English), built with Next.js 16.

This document explains how every system works and where it lives. Read it before changing anything.

---

## 1. The concept: a flight

The whole site is **one flight from the ground to the edge of space**.

1. **On the ground the page compiles itself** as you scroll the hero: raw HTML → 12-column grid →
   typography → color → motion. This "compile" is the signature moment of the site.
2. When it finishes, the page's grid **folds down into the ground** and becomes a runway (3D).
3. The camera **climbs** through the sky. Each section sits at an altitude, the sky color changes
   with altitude, and an altimeter on the right edge shows where you are.
4. Each project is a **station** with a 3D "instrument" that explains it without words.
5. Contact is at the **Kármán line** (100 km): black sky, stars, the DREAMX mark in 3D.

Manifesto: *"Ingeniería con los pies en la tierra. Ideas a gran altitud."* /
*"Grounded engineering. High-altitude ideas."*

### Waypoints (`src/content/flight.ts`)

| id | Section | Layer | Altitude | Sky | Ink |
|---|---|---|---|---|---|
| `hero` | Compile + manifesto | Suelo / Ground | 0 m | `#D5D9D8` | dark |
| `log` | Logbook (Bitácora) | Pista / Runway | 120 m | `#C6D0D4` | dark |
| `about` | Flight plan (Plan de vuelo) | Ascenso inicial / Initial climb | 350 m | `#BAC8D1` | dark |
| `apex` | APEX (F1 simulator) | Capa límite / Boundary layer | 800 m | `#AFC2CF` | dark |
| `hub` | Campuslands Access Hub | Troposfera | 6 km | `#3B5C80` | light |
| `tenant` | TENANT (SST/PESV) | Estratosfera | 20 km | `#1B2F5A` | light |
| `contact` | Contact | Línea de Kármán | 100 km | `#000000` | light |

Adding or reordering a waypoint shifts every station index: 3D objects find theirs with
`flight.findIndex`, so they follow automatically, but check the runway fade thresholds
(`Runway.tsx`) and the hero index list (`Hero.tsx`).

---

## 2. Stack

Next.js **16.3** (App Router, Turbopack) · React 19.2 · TypeScript · Tailwind CSS 4 ·
React Three Fiber 9 + Drei 10 + Three 0.186 · GSAP 3.15 (ScrollTrigger, Flip) · Lenis ·
Zustand 5 · cmdk · Anthropic SDK · Web Audio API (no audio files).

> Next 16 differs from older versions: middleware is now `src/proxy.ts`, route types come from
> `next typegen` (`PageProps<"/[lang]/...">`), docs live in `node_modules/next/dist/docs/`.

---

## 3. Routes and i18n

| Route | File | Notes |
|---|---|---|
| `/` | `src/proxy.ts` | Redirects to `/es` or `/en` from `Accept-Language` (default `es`). |
| `/[lang]` | `src/app/[lang]/page.tsx` | The flight. Person JSON-LD. |
| `/[lang]/work/[station]` | `src/app/[lang]/work/[station]/page.tsx` | Case study per project (`apex`, `hub`, `tenant`). Static. |
| `/[lang]/quick` | `src/app/[lang]/quick/page.tsx` | "Quick version" for recruiters: everything on one page, no flight. |
| `/api/ask` | `src/app/api/ask/route.ts` | "Ask the portfolio" assistant (streaming). |
| `/sitemap.xml`, `/robots.txt` | `src/app/sitemap.ts`, `robots.ts` | Use `NEXT_PUBLIC_SITE_URL`. |
| OG image | `src/app/[lang]/opengraph-image.tsx` | Generated with `next/og`. |

- Native i18n (no next-intl): `src/i18n/config.ts` (locales), `src/i18n/dictionaries.ts`
  (`getDictionary`, `getCases`), copy in `src/i18n/dictionaries/{es,en}.json` and case studies in
  `src/i18n/cases/{es,en}.json`. **Keep both languages in the same shape**; `es` is the source type.
- Language-neutral data (altitudes, colors, stacks, links, tools) lives in `src/content/flight.ts`.
- The root layout is `src/app/[lang]/layout.tsx`: fonts, header (logo, quick version, sound,
  command palette, language switch), altimeter, 3D world, transition layer, smooth scroll, sky controller.

---

## 4. Design system

Tokens in `src/app/globals.css` (`@theme`):

- **Color comes from altitude.** `--sky` and `--ink` are set at runtime (see §6). Named tokens:
  `concrete`, `graphite` (ink on light), `cloud` (ink on dark), `cobalt`, `void`, `runway`.
- **One accent only: `runway` amber `#FFB000`.** Focus rings, altimeter needle, text selection,
  runway lights in 3D. Nothing else.
- **Type:** Anybody (display, variable `wdth` axis 50–150, animated) + Instrument Sans (reading).
  Names get wider and lighter the higher the station. Perfect-fourth scale `text-step--1` … `text-step-6`
  (`step-5`/`step-6` also depend on viewport height so the hero fits short screens).
- **Layout grammar:** asymmetric 12-column grid, left aligned. **Text on the left (`md:col-span-5`),
  the 3D instrument on the right** (an empty `md:col-span-7` column). The right edge is reserved for the
  altimeter (`md:pr-40`).
- **Avoid template tells:** no all-caps eyebrow labels, no "A · B · C" meta strings, no "→" on links,
  no mono data labels (except the compile log, which *is* code output), no fade-up on every section,
  no identical cards. Every effect must say something about the flight or about Daniel's work.
- Contrast was checked for WCAG AA; small labels use `opacity-80`, not lower.

---

## 5. The compile sequence (hero)

**Status: approved as final by the owner. Do not change its look or timing.**

Files: `src/components/sections/Hero.tsx`, `src/components/sections/Compiler.tsx`, compile rules in
`globals.css`, inline script in `layout.tsx`.

- The hero is a **400svh track** with a sticky viewport.
- `<html data-build="layout type color motion">` gains one token per stage. Tailwind custom variants
  `b-layout:`, `b-type:`, `b-color:`, `b-motion:` apply a class only once that stage is built.
  Without tokens, CSS in `globals.css` restores the look of an unstyled HTML document (Times, blue
  links, default margins, white page).
- **Continuous layer:** scroll through the track is smoothed (GSAP scrub 0.9) into the CSS variable
  `--build` (0 → 4). CSS derives `--guides` (red grid columns drawing down in cascade) and `--paint`
  (`color-mix` from white to the sky) from it.
- **Discrete layer:** stages switch at `--build` 0.5 / 1.5 / 2.5 / 3.5. Layout and type changes are
  animated in time with GSAP **Flip** (cascade) and a word-by-word blur-to-focus (`[data-word]`). The
  motion stage assembles the logo pieces (`header [data-part]`).
- **Server HTML ships fully built** (works without JS). An inline `<head>` script **only on the home
  route** strips the build before first paint (`data-build=""`, `--build: 0`). With
  `prefers-reduced-motion` it sets `data-locked` instead and the page arrives built.
- The header, altimeter and 3D canvas carry `data-chrome` and only appear with the `motion` stage.
- The compile log (bottom right) has "Skip the build", which scrolls to the end of the track via Lenis.
- `apply(0)` runs **before** the ScrollTrigger is created: when the page reloads already scrolled past
  the hero, creating the trigger applies the full build immediately and must not be undone.

---

## 6. Scroll, sky and altimeter

- **Smooth scroll:** `src/components/providers/SmoothScroll.tsx`, Lenis driven by GSAP's ticker.
  **Programmatic scrolling must use `useFlight.getState().lenis`**; `window.scrollTo` gets overridden.
- **Sky controller:** `src/components/providers/SkyController.tsx`. Each waypoint is "reached" when its
  section is centered (the hero when its track ends). Between waypoints it interpolates `--sky`,
  switches `--ink`, interpolates altitude in log space, and writes `altitude`, `layer` and `progress`
  (0..1 along the waypoints) to the store.
- **Parked pages:** an element with `data-station-page="<id>"` (case studies, quick page uses `hero`)
  parks the flight at that station instead, and lowers the 3D world's `presence` as you read
  (also lower on phones). During a project transition `park()` leaves sky/altitude to the transition.
- **Altimeter:** `src/components/chrome/Altimeter.tsx`, fixed on the right, decorative (`aria-hidden`).

### Stores (`src/store/`)
- `flight.ts` (Zustand): `altitude`, `layer`, `progress`, `lenis`, `stage`, `presence`, `transition`.
- `live.ts`: numbers produced by the 3D world that the page shows as text (Hub check-ins).

---

## 7. The 3D world (`src/components/world/`)

One **persistent, transparent canvas** for the whole site (`WorldMount` lazy-loads `World` with
`ssr: false`; skipped entirely without WebGL). It sits behind the content (`z-0`), never takes pointer
events, and appears with the compile's motion stage.

- **`Rig.tsx`:** damps flight progress into camera height (`GAP` = 14 world units per waypoint), pitch
  0.3 rad looking down; samples sky/ink into `atmosphere`; fog takes the sky color; tracks the cursor
  (`atmosphere.pointer`, `pressed`) from window events; computes `stageX` (center of the right column;
  0 on phones). During a transition it drives `presence` to 0.
- **`atmosphere.ts`:** shared mutable state (`sky`, `ink`, `darkness`, `progress`, `presence`,
  `pointer`, `pressed`, `stageX`), `proximity(index)` (each object fades in only near its altitude).
- **`stage.tsx`:** `Anchor` (places an object at its station in the right column, leans toward the
  cursor), `Solid` + `useSolidMaterials` (the shared "technical drawing" look: faint sky-colored fill +
  ink edges), `box()` geometry cache, `cursorDistance()` (hover without pointer events), `paintLines()`.

| Object | Station | What it shows | Interaction |
|---|---|---|---|
| `Runway` | hero → log | The page grid (GLSL shader, `fwidth` lines) folding down into a runway with amber lights | — |
| `RobotArm` | log | Robotic forearm (base, turret, shoulder, elbow, wrist, 3 fingers) | Follows the cursor; mouse down closes the hand |
| `Constellation` | about | Projects linked to the tools they used; learning tools on the outer ring (italic) | Hover lights only a node's connections. Labels are one plain DOM layer positioned per frame (not drei `Html`) |
| `Circuit` | apex | Procedural low-poly F1 car on a closed spline track, with trail | Slows in corners (curvature), turns toward the cursor |
| `Attendance` | hub | 220 attendees spiraling into a check-in gate | Crowd steps around the cursor (ray–plane hit); each arrival increments `useLive` |
| `Strata` | tenant | Shared core, 3 strata, 5 isolated tenants, data pulses core↔tenant only | Hover a tenant: only its path stays lit |
| `Stars` + `Logo3D` | contact | Star field; the DREAMX "D" extruded (SVGLoader + ExtrudeGeometry), metallic, lit | Mark turns toward the cursor |
| `MorphSwarm` | transitions | 700 particles that take the current instrument's shape, travel and re-form as the next one | — |

ESLint's React Compiler purity rules (`immutability`, `purity`, `refs`) are **off for this folder on
purpose**: R3F mutates Three.js objects inside `useFrame`.

---

## 8. Project transitions (`src/components/transition/`)

Moving between projects re-orders the page instead of cutting. Used from: home station → case study,
case → case ("Next station", the station rail, ← / → keys, horizontal swipe on touch), the command
palette and the quick page.

`orchestrator.ts` → `goToProject(router, href, to)` runs three acts (≤ 1.2 s, interruptible):

| Time | Visual | 3D | Sound (if on) |
|---|---|---|---|
| 0–250 ms | Visible elements exit by role; the 12-column red scaffold draws in | Instruments fade (`presence` → 0), swarm appears in the current shape | Exit note + scaffold clicks |
| 250–700 ms | Route changes (`data-transition="pending"` hides the new page's parts); only the **title travels** (ghost copy; condenses, renames and widens if the project changed); altimeter counts; `--sky` tweens | Camera climbs/descends; swarm travels | Wind sweep (up or down) |
| 700–1200 ms | New page compiles in reading order; scaffold leaves | Swarm re-forms as the new instrument, objects return | Thud + arrival note + project texture |

- Opt-in markup: `data-exit="text" | "title" | "media"` on elements that should exit/enter;
  `data-shared-title` on the project title (the ghost lands there; it gets focus on arrival).
- `TransitionLayer.tsx` (in the layout): scaffold columns (inline `transform`, see gotchas), ghost
  layer, and a live region that announces "Llegaste a / You arrived at …".
- `ProjectLink.tsx`: wraps `next/link`; hover prefetches and plays the destination's note softly;
  modified clicks behave normally.
- `StationRail.tsx`: on case studies, the three stations with altitudes; ← / → and swipe.
- Reduced motion: a short fade only. Touch devices get a short vibration on arrival (Android).
- Durations: `EXIT`, `TRAVEL`, `ENTER` constants at the top of `orchestrator.ts`.

---

## 9. Sound (`src/lib/`)

Everything is generated with the Web Audio API. **Off by default**; nothing is created until the
visitor presses "Activar sonido" (`src/components/chrome/SoundToggle.tsx`).

- **`sound.ts`:** `createEngine()` (wind + drone that follow altitude, hover ticks, compile-stage
  clicks, transition cues: `note`, `scaffold`, `sweep`, `thud`, `texture`) and the **`sound` bus**
  (`sound.engine` is the engine while sound is on, `null` otherwise; every cue is a no-op when off).
  Project notes form a rising A-major triad: ground E3, APEX A3, Hub C#4, TENANT E4.
- **`sonic.ts`:** what the 3D world tells the sound. Objects write state every frame (`level` per scene
  = proximity × presence, `armSpeed`, `carSpeed`/`carPan`/`carApproach`, `crowdCursor`, `tenantFocus`,
  `logoSpin`) and `emit()` events (`grip`, `shift`, `checkin`, `packet`, `star`, `arpeggio`).
- **`soundscape.ts`:** six scenes built lazily on first audibility, levels crossfade with scroll and
  duck during transitions; everything in A major.

| Scene | Sound |
|---|---|
| log | Servo whine pitched by arm speed, gripper clacks, occasional radio chirps (Micro:Bit link) |
| about | Breathing A-major pad; a star rings its pentatonic note; a project arpeggiates its tools |
| apex | FM engine synced to the car (revs on straights, drops in corners, upshift on exit), tyre noise, stereo pan + Doppler, team-radio squelch |
| hub | Crowd murmur (5 band-passed noise voices) that opens up around the cursor; scanner beep per check-in (rate-limited) |
| tenant | Server hum + fans; a click per packet panned to its tenant; hovering a tenant muffles all others |
| contact | Near silence; the metal mark rings like a bell when it starts turning; rare star glints |

---

## 10. Content and case studies

- Home sections: `Hero` (compile, locked), `Logbook` (log), `FlightPlan` (about), `Station` ×3,
  `Contact`. Kept short on purpose; long copy lives in case studies, the quick page and the assistant.
- Case studies (`src/i18n/cases/*.json`): intro, year, team, role, challenge, sections (with optional
  image), decisions, outcome. Images in `public/work/` (sizes registered in the case page).
  - APEX images are real screenshots of the running JavaFX app plus the Figma mockup.
  - Access Hub is a **private** project: no screenshots, only the 3D representation and the LinkedIn post.
  - TENANT shows its relational model.

### Facts that must stay accurate
- **APEX** (F1 qualifying simulator): **team project**, repo `github.com/CondezPancake/Formula1Simulator`.
  Daniel's part: UI design/mockups, JavaFX screens, domain and simulation engine. Java 17, JavaFX,
  MySQL, Maven, JUnit; hexagonal architecture; 230 tests; 59 user stories; 24 views; 28 race events.
- **Campuslands Access Hub**: private; team of four; first production deploy; hundreds of participants
  at the Campuslands hackathon (2 days). Daniel: **frontend** (attendance check-in, role-based views,
  executive dashboard). Stack: TypeScript, JavaScript, HTML, CSS, Docker, PL/pgSQL.
- **TENANT** (multi-tenant SST/PESV platform): Daniel's own repo
  `github.com/TuMinipeka/Plataforma_multi-tenant_de_gesti-n_SST-PESV`. PostgreSQL 16, 20 tables in 4NF,
  15 procedures + 8 functions + 15 triggers (38), Docker.
- Background (from his CV): UDI robotics program (WALL-E-inspired robot, 1st place, Feb 2024–May 2025);
  technical high school diploma at Colegio Portal Campestre Norte (master-slave robotic forearm with
  Micro:Bit, FSR sensors, Arduino Nano, Feb–Dec 2025); Software development technician at Campuslands,
  Floridablanca (Dec 2025–now), Visual Agents hackathon. Spanish native, English B1.
- Contact: danielsantiagomayorga03@gmail.com · LinkedIn `/in/daniel-santiago-mayorga-tellez-5bb0463a0` ·
  GitHub `TuMinipeka` · CV on Google Drive (link in `flight.ts`).

---

## 11. Command palette and assistant

- `src/components/chrome/CommandPalette.tsx` (cmdk), `Ctrl/Cmd + K` or "Navegar" in the header:
  sections, case studies (through the transition), quick version, copy email, CV, LinkedIn, GitHub,
  language. Typing a question shows **"Ask the portfolio"**.
- `src/app/api/ask/route.ts`: answers one question grounded only in the site's content (dictionaries +
  case studies), streamed as plain text, ≤ 90 words, in the visitor's language. Model `claude-opus-5-5`
  at low effort with server-side fallback; system prompt cached. Limits: 400 characters per question,
  8 questions per IP per 10 minutes (in-memory, best effort). **Without `ANTHROPIC_API_KEY` it returns
  503** and the palette says the assistant is unavailable.

---

## 12. Accessibility and resilience

- Skip link, landmarks, one `h1` per page, visible focus (amber), `lang` per route.
- `prefers-reduced-motion`: page arrives built, no smooth scroll, still 3D objects, transitions become a fade.
- No WebGL: the 3D layer is skipped; all content remains.
- No JavaScript: the server HTML is fully built and readable.
- Decorative layers (`Altimeter`, canvas, constellation labels) are `aria-hidden`; the constellation's
  tools and learning lists are repeated in screen-reader-only text.

---

## 13. Development

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npm start
npm run lint
npx next typegen       # after adding routes (PageProps types)
```

- Environment (`.env.local`, see `.env.example`): `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
- Formatting: Prettier with `--print-width 120`.
- Dev-only handles for browser automation: `window.__lenis`, `window.__world` (atmosphere + camera),
  `window.__sonic` / `window.__audio` (after enabling sound).

### Gotchas already solved (don't reintroduce)
- **Tailwind 4 `scale-*` uses the CSS `scale` property; GSAP animates `transform`.** They multiply.
  Elements GSAP scales must not use Tailwind scale classes (see the scaffold columns).
- **Backslashes inside template literals / inline scripts get consumed.** The pre-paint script uses a
  path split instead of a regex; the JSON-LD escape uses `String.fromCharCode(92)`.
- **drei `Html` creates one React root per label** → "synchronously unmount a root" errors. Use a plain
  DOM layer instead (see `Constellation.tsx`).
- **zustand v5** `subscribe((state, prev) => …)` is used for stage/progress listeners.
- **Window keyboard events** may have `window` as `target` (no `.closest`): check `instanceof Element`.
- Running `next typegen` / `next build` while `next dev` is running can crash the dev server; restart it.
- In a background browser tab `requestAnimationFrame` stops: GSAP, R3F and Lenis pause. Test with the
  window in front.
