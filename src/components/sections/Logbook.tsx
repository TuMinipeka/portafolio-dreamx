import type { Dictionary } from "@/i18n/dictionaries";

/**
 * On the runway: where Daniel comes from, as a short dated log (a real sequence,
 * so it's an ordered list). The robotic arm on the right is the story told in 3D.
 */
export function Logbook({ copy }: { copy: Dictionary["log"] }) {
  return (
    <section
      id="log"
      aria-labelledby="log-title"
      className="grid min-h-svh content-center gap-10 px-5 py-28 md:grid-cols-12 md:px-8 md:pr-40"
    >
      <div className="md:col-span-5">
        <h2
          id="log-title"
          className="font-display text-step-4 leading-[1.02] font-bold [font-variation-settings:'wdth'_80]"
        >
          {copy.heading}
        </h2>
        <p className="mt-5 max-w-[36ch] text-step-1 leading-snug">{copy.short}</p>

        <ol className="mt-10 flex flex-col">
          {copy.entries.map((entry, i) => (
            <li key={entry.when} className="grid gap-1 border-t border-current/30 py-4 last:border-b">
              <p className="tabular text-step--1 opacity-80">{entry.when}</p>
              <h3 className="text-step-0 leading-snug font-medium">{entry.where}</h3>
              <p className="max-w-[44ch] text-step-0 leading-relaxed">{copy.entriesShort[i]}</p>
            </li>
          ))}
        </ol>

        <p aria-hidden className="mt-6 hidden max-w-[36ch] text-step--1 opacity-80 pointer-fine:block">
          {copy.hint}
        </p>
      </div>

      {/* The robotic arm stands in this column. */}
      <div aria-hidden className="hidden md:col-span-7 md:block" />
    </section>
  );
}
