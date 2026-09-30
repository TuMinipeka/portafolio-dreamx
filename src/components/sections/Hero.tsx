import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Ground level. The manifesto sits on a single hairline that stands for the
 * ground: the first line is set condensed and heavy (feet on the ground),
 * the second takes off into a wide, light cut.
 */
export function Hero({ copy }: { copy: Dictionary["hero"] }) {
  const [ground, sky] = copy.manifesto;

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="flex min-h-svh flex-col justify-end px-5 pt-28 pb-8 md:px-8 md:pr-40"
    >
      <div className="mb-auto max-w-[34ch]">
        <p className="text-step-1 font-medium">{copy.name}</p>
        <p className="text-step-0 opacity-70">{copy.role}</p>
      </div>

      <h1 id="hero-title" className="mt-16">
        <span className="manifesto-ground block text-step-5 md:text-step-6">{ground}</span>
        <span className="manifesto-sky mt-3 block text-step-3 md:text-step-5">{sky}</span>
      </h1>

      <div className="mt-8 flex flex-col gap-6 border-t border-current/40 pt-5 md:flex-row md:items-start md:justify-between">
        <p className="max-w-[46ch] text-step-0 leading-relaxed">{copy.intro}</p>
        <p className="text-step--1 opacity-70">{copy.scrollHint}</p>
      </div>
    </section>
  );
}
