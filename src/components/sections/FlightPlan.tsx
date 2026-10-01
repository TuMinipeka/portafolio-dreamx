import type { Dictionary } from "@/i18n/dictionaries";
import { tools } from "@/content/flight";

// The three DREAMX values climb like everything else on the page:
// each word is set a little wider and lighter than the one before.
const valueCut = [
  "[font-variation-settings:'wdth'_70] font-extrabold",
  "[font-variation-settings:'wdth'_100] font-semibold",
  "[font-variation-settings:'wdth'_130] font-light",
];

type Props = { copy: Dictionary["about"]; languages: { label: string; value: string }; toolsLabel: string };

/**
 * Initial climb: who Daniel is beyond the projects, built on his own brand values.
 * His tools don't appear as a list here: they're the constellation on the right.
 */
export function FlightPlan({ copy, languages, toolsLabel }: Props) {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="grid min-h-svh content-center gap-10 px-5 py-28 md:grid-cols-12 md:px-8 md:pr-40"
    >
      <div className="md:col-span-5">
        <h2 id="about-title" className="text-step-0 opacity-80">
          {copy.name}
        </h2>

        <ul className="mt-6 flex flex-col gap-6">
          {copy.values.map((value, i) => (
            <li key={value.title}>
              <h3 className={`font-display text-step-4 leading-none ${valueCut[i]}`}>{value.title}</h3>
              <p className="mt-2 max-w-[36ch] text-step-0 leading-relaxed">{copy.valuesShort[i]}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-10 grid gap-3 border-t border-current/30 pt-5 text-step-0">
          <div>
            <dt className="sr-only">{copy.seekingLabel}</dt>
            <dd>{copy.seekingShort}</dd>
          </div>
          <div>
            <dt className="sr-only">{copy.offLabel}</dt>
            <dd>{copy.offShort}</dd>
          </div>
          <div>
            <dt className="sr-only">{languages.label}</dt>
            <dd className="opacity-80">{languages.value}</dd>
          </div>
          {/* The constellation is visual only; the same facts, for screen readers. */}
          <div className="sr-only">
            <dt>{toolsLabel}</dt>
            <dd>{tools.join(", ")}</dd>
          </div>
          <div className="sr-only">
            <dt>{copy.learningLabel}</dt>
            <dd>{copy.learning.join(", ")}</dd>
          </div>
        </dl>
      </div>

      {/* The skills constellation stands in this column. */}
      <div aria-hidden className="hidden flex-col justify-end md:col-span-7 md:flex">
        <p className="hidden max-w-[44ch] self-end text-step--1 opacity-80 pointer-fine:block">{copy.hint}</p>
      </div>
    </section>
  );
}
