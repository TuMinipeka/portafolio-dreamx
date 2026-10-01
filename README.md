# DREAMX · Daniel Mayorga portfolio

Bilingual (es/en) portfolio built as a flight: the page compiles itself on the ground, then climbs through a 3D sky to three project stations and the Kármán line.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Environment

Copy `.env.example` to `.env.local`:

- `ANTHROPIC_API_KEY` enables "ask the portfolio" in the command palette (Ctrl+K). Without it the assistant politely says it's unavailable.
- `NEXT_PUBLIC_SITE_URL` is the public URL, used for the sitemap, robots and social previews.

## Documentation

How every system works (concept, compile sequence, 3D world, transitions, sound, content): [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · React Three Fiber + Drei + GLSL · GSAP (ScrollTrigger, Flip) · Lenis · Zustand · cmdk · Web Audio API · Anthropic SDK.
