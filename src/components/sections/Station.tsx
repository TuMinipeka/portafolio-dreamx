import type { Dictionary } from "@/i18n/dictionaries";
import { LiveCheckins } from "./LiveCheckins";
import { ProjectLink } from "@/components/transition/ProjectLink";
import type { Locale } from "@/i18n/config";
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
  lang: Locale;
  openLabel: string;
};

export function Station({ station, copy, labels, lang, openLabel }: Props) {
  const titleId = `${station.id}-title`;

  const hint = station.id === "hub" ? labels.hubHint : station.id === "tenant" ? labels.tenantHint : null;

  return (
    <section
      id={station.id}
      aria-labelledby={titleId}
      className="grid min-h-svh content-center gap-10 px-5 py-28 md:grid-cols-12 md:px-8 md:pr-40"
    >
      <div className="flex flex-col gap-8 md:col-span-5">
        <header>
          <h2
            id={titleId}
            data-shared-title
            className={`font-display text-step-5 leading-[0.95] break-words ${nameCut[station.id]}`}
          >
            {copy.name}
          </h2>
          <p data-exit="text" className="mt-4 max-w-[30ch] text-step-1">
            {copy.kind}
          </p>
        </header>

        <ul className="flex max-w-[36ch] flex-col border-t border-current/30">
          {copy.facts.map((fact) => (
            <li key={fact} data-exit="text" className="border-b border-current/30 py-2 text-step-0">
              {fact}
            </li>
          ))}
        </ul>

        {station.id === "hub" ? (
          <div data-exit="text">
            <LiveCheckins label={labels.liveCheckins} />
          </div>
        ) : null}
        {hint ? (
          <p aria-hidden className="hidden max-w-[36ch] text-step--1 opacity-80 pointer-fine:block">
            {hint}
          </p>
        ) : null}

        <div data-exit="text" className="flex flex-col items-start gap-3">
          <ProjectLink
            href={`/${lang}/work/${station.id}`}
            station={station.id}
            className="text-step-1 font-medium underline decoration-1 underline-offset-8 hover:decoration-2"
          >
            {openLabel}
          </ProjectLink>
          <a
            href={station.href}
            target="_blank"
            rel="noreferrer"
            className="text-step-0 underline decoration-1 underline-offset-4 opacity-80 hover:decoration-2 hover:opacity-100"
          >
            {copy.linkLabel}
          </a>
        </div>
      </div>

      {/* The station's 3D instrument stands in this column. */}
      <div aria-hidden className="hidden md:col-span-7 md:block" />
    </section>
  );
}
