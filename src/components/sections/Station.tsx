import type { Dictionary } from "@/i18n/dictionaries";
import type { StationId, stations } from "@/content/flight";

// The higher the station, the wider and lighter its name is set:
// type thins out with the air.
const nameCut: Record<StationId, string> = {
  apex: "[font-variation-settings:'wdth'_68] font-extrabold",
  hub: "[font-variation-settings:'wdth'_100] font-medium",
  tenant: "[font-variation-settings:'wdth'_135] font-light",
};

type Props = {
  station: (typeof stations)[number];
  copy: Dictionary["stations"][StationId];
  labels: Dictionary["station"];
};

export function Station({ station, copy, labels }: Props) {
  const titleId = `${station.id}-title`;

  return (
    <section
      id={station.id}
      aria-labelledby={titleId}
      className="grid min-h-svh content-center gap-10 px-5 py-28 md:grid-cols-12 md:px-8 md:pr-40"
    >
      <header className="md:col-span-7">
        <h2
          id={titleId}
          className={`font-display text-step-5 leading-[0.95] break-words ${nameCut[station.id]}`}
        >
          {copy.name}
        </h2>
        <p className="mt-4 max-w-[36ch] text-step-1">{copy.kind}</p>
      </header>

      <div className="flex max-w-[52ch] flex-col gap-8 md:col-span-5 md:self-end">
        <p className="text-step-0 leading-relaxed">{copy.summary}</p>

        <ul className="flex flex-col border-t border-current/30">
          {copy.facts.map((fact) => (
            <li key={fact} className="border-b border-current/30 py-2 text-step-0">
              {fact}
            </li>
          ))}
        </ul>

        <dl className="grid gap-5 text-step-0">
          <div>
            <dt className="text-step--1 opacity-70">{labels.role}</dt>
            <dd className="mt-1 leading-relaxed">{copy.role}</dd>
          </div>
          <div>
            <dt className="text-step--1 opacity-70">{labels.stack}</dt>
            <dd className="mt-1">{station.stack.join(", ")}</dd>
          </div>
        </dl>

        <a
          href={station.href}
          target="_blank"
          rel="noreferrer"
          className="self-start text-step-0 font-medium underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {copy.linkLabel}
        </a>
      </div>
    </section>
  );
}
