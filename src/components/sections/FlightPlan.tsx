import type { Dictionary } from "@/i18n/dictionaries";

// The three DREAMX values climb like everything else on the page:
// each word is set a little wider and lighter than the one before.
const valueCut = [
  "[font-variation-settings:'wdth'_70] font-extrabold",
  "[font-variation-settings:'wdth'_105] font-semibold",
  "[font-variation-settings:'wdth'_140] font-light",
];

/** Initial climb: who Daniel is beyond the projects, organized around his own brand values. */
export function FlightPlan({ copy }: { copy: Dictionary["about"] }) {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="grid min-h-svh content-center gap-14 px-5 py-28 md:grid-cols-12 md:px-8 md:pr-40"
    >
      <header className="md:col-span-6">
        <h2 id="about-title" className="text-step-0 opacity-80">
          {copy.name}
        </h2>
        <p className="mt-6 max-w-[48ch] text-step-1 leading-snug">{copy.intro}</p>
      </header>

      <ul className="grid gap-10 md:col-span-12">
        {copy.values.map((value, i) => (
          <li key={value.title} className="grid gap-3 border-t border-current/30 pt-5 md:grid-cols-12 md:gap-6">
            <p aria-hidden className={`font-display text-step-5 leading-none md:col-span-7 ${valueCut[i]}`}>
              {value.title}
            </p>
            <div className="md:col-span-5">
              <h3 className="sr-only">{value.title}</h3>
              <p className="max-w-[48ch] text-step-0 leading-relaxed">{value.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="grid gap-10 text-step-0 sm:grid-cols-2 md:col-span-12 lg:grid-cols-4">
        <div>
          <dt className="text-step--1 opacity-80">{copy.seekingLabel}</dt>
          <dd className="mt-2 leading-relaxed">{copy.seeking}</dd>
        </div>
        <div>
          <dt className="text-step--1 opacity-80">{copy.learningLabel}</dt>
          <dd className="mt-2">
            <ul className="grid gap-1">
              {copy.learning.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="text-step--1 opacity-80">{copy.teamLabel}</dt>
          <dd className="mt-2 leading-relaxed">{copy.team}</dd>
        </div>
        <div>
          <dt className="text-step--1 opacity-80">{copy.offLabel}</dt>
          <dd className="mt-2 leading-relaxed">{copy.off}</dd>
        </div>
      </dl>
    </section>
  );
}
