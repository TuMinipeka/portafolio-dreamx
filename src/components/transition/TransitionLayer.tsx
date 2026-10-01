/**
 * Fixed overlay used by project transitions (see orchestrator.ts):
 *  - the scaffold: the page's 12-column grid, shown for a moment while the page re-orders
 *  - the ghost: a copy of the project title that travels from the old page to the new one
 *  - a polite live region that announces where the visitor arrived
 * Server-rendered and inert until a transition drives it.
 */
export function TransitionLayer({ arrivedLabel }: { arrivedLabel: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <div
        id="transition-scaffold"
        aria-hidden
        className="absolute inset-0 grid grid-cols-4 gap-4 px-5 md:grid-cols-12 md:px-8 md:pr-40"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            // GSAP animates `transform`; Tailwind's scale-* uses the separate `scale` property.
            style={{ transform: "scaleY(0)", transformOrigin: "top" }}
            className={`bg-[rgb(255_0_0/0.07)] ${i >= 4 ? "max-md:hidden" : ""}`}
          />
        ))}
      </div>
      <div id="transition-ghost" aria-hidden className="absolute inset-0" />
      <p id="transition-status" role="status" data-arrived={arrivedLabel} className="sr-only" />
    </div>
  );
}
