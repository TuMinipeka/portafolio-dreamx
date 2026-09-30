import type { Dictionary } from "@/i18n/dictionaries";
import { tools } from "@/content/flight";

/** On the runway: who Daniel is, told as a dated flight log (a real sequence, so it's an ordered list). */
export function Logbook({ copy }: { copy: Dictionary["log"] }) {
  return (
    <section
      id="log"
      aria-labelledby="log-title"
      className="grid min-h-svh content-center gap-12 px-5 py-28 md:grid-cols-12 md:px-8 md:pr-40"
    >
      <header className="md:col-span-5">
        <h2
          id="log-title"
          className="font-display text-step-4 leading-[1.02] font-bold [font-variation-settings:'wdth'_80]"
        >
          {copy.heading}
        </h2>
        <p className="mt-6 max-w-[40ch] text-step-0 leading-relaxed">{copy.body}</p>

        <dl className="mt-10 grid max-w-[40ch] gap-5 text-step-0">
          <div>
            <dt className="text-step--1 opacity-80">{copy.toolsLabel}</dt>
            <dd className="mt-1">{tools.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-step--1 opacity-80">{copy.languagesLabel}</dt>
            <dd className="mt-1">{copy.languages}</dd>
          </div>
        </dl>
      </header>

      <ol className="flex flex-col md:col-span-6 md:col-start-7 md:self-center">
        {copy.entries.map((entry) => (
          <li key={entry.when} className="grid gap-2 border-t border-current/30 py-6 last:border-b">
            <p className="tabular text-step--1 opacity-80">{entry.when}</p>
            <h3 className="text-step-1 leading-snug font-medium">{entry.where}</h3>
            <p className="max-w-[56ch] text-step-0 leading-relaxed">{entry.what}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
