import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/i18n/config";
import { getCases, getDictionary } from "@/i18n/dictionaries";
import { stations, type StationId } from "@/content/flight";
import { BuildComplete } from "@/components/case/BuildComplete";

type Figure = { src: string; alt: string; caption: string };
type CaseStudy = {
  intro: string;
  year: string;
  team: string;
  role: string;
  challenge: string;
  sections: { heading: string; body: string; image?: Figure }[];
  decisions: { title: string; body: string }[];
  outcome: { value: string; label: string }[];
};

// Intrinsic sizes of the exported case images, so next/image can reserve space.
const imageSize: Record<string, [number, number]> = {
  "/work/apex/mockup.webp": [1800, 1126],
  "/work/apex/setup.webp": [1800, 929],
  "/work/apex/live.webp": [1800, 929],
  "/work/apex/results.webp": [1800, 929],
  "/work/tenant/relational.webp": [2000, 1557],
};

const nameCut: Record<StationId, string> = {
  apex: "[font-variation-settings:'wdth'_68] font-extrabold",
  hub: "[font-variation-settings:'wdth'_100] font-medium",
  tenant: "[font-variation-settings:'wdth'_135] font-light",
};

const isStation = (value: string): value is StationId => stations.some((s) => s.id === value);

export function generateStaticParams() {
  return locales.flatMap((lang) => stations.map((s) => ({ lang, station: s.id })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/work/[station]">): Promise<Metadata> {
  const { lang, station } = await params;
  if (!hasLocale(lang) || !isStation(station)) return {};
  const [dict, cases] = await Promise.all([getDictionary(lang), getCases(lang)]);
  return {
    title: `${dict.stations[station].name} | Daniel Mayorga`,
    description: (cases[station] as CaseStudy).intro,
    alternates: { languages: { es: `/es/work/${station}`, en: `/en/work/${station}` } },
  };
}

export default async function CasePage({ params }: PageProps<"/[lang]/work/[station]">) {
  const { lang, station } = await params;
  if (!hasLocale(lang) || !isStation(station)) notFound();

  const [dict, cases] = await Promise.all([getDictionary(lang), getCases(lang)]);
  const study = cases[station] as CaseStudy;
  const labels = cases.labels;
  const copy = dict.stations[station];
  const meta = stations.find((s) => s.id === station)!;
  const nextId = stations[(stations.findIndex((s) => s.id === station) + 1) % stations.length].id;

  return (
    <article data-station-page={station} className="px-5 md:px-8 md:pr-40">
      <BuildComplete />

      <header className="flex min-h-svh flex-col justify-end pt-28 pb-16">
        <Link
          href={`/${lang}#${station}`}
          className="mb-auto self-start text-step-0 underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {labels.back}
        </Link>

        <h1 className={`font-display text-step-6 leading-[0.92] break-words ${nameCut[station]}`}>{copy.name}</h1>
        <p className="mt-4 max-w-[40ch] text-step-2 leading-snug">{copy.kind}</p>

        <dl className="mt-12 grid gap-6 border-t border-current/30 pt-6 text-step-0 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-step--1 opacity-80">{labels.role}</dt>
            <dd className="mt-1 leading-relaxed">{study.role}</dd>
          </div>
          <div>
            <dt className="text-step--1 opacity-80">{labels.team}</dt>
            <dd className="mt-1">{study.team}</dd>
          </div>
          <div>
            <dt className="text-step--1 opacity-80">{labels.year}</dt>
            <dd className="mt-1 tabular">{study.year}</dd>
          </div>
          <div>
            <dt className="text-step--1 opacity-80">{labels.stack}</dt>
            <dd className="mt-1">{meta.stack.join(", ")}</dd>
          </div>
        </dl>
      </header>

      <p className="max-w-[34ch] py-16 font-display text-step-3 leading-snug font-light [font-variation-settings:'wdth'_112]">
        {study.intro}
      </p>

      <section aria-labelledby="challenge" className="grid gap-6 border-t border-current/30 py-16 md:grid-cols-12">
        <h2 id="challenge" className="text-step-1 font-medium md:col-span-4">
          {labels.challenge}
        </h2>
        <p className="max-w-[60ch] text-step-1 leading-relaxed md:col-span-7 md:col-start-6">{study.challenge}</p>
      </section>

      {study.sections.map((section) => {
        const size = section.image ? imageSize[section.image.src] : undefined;
        return (
          <section
            key={section.heading}
            className="grid gap-8 border-t border-current/30 py-16 md:grid-cols-12 md:gap-10"
          >
            <div className={section.image ? "md:col-span-4" : "md:col-span-7 md:col-start-6"}>
              <h2 className="font-display text-step-3 leading-tight font-semibold [font-variation-settings:'wdth'_90]">
                {section.heading}
              </h2>
              <p className="mt-5 max-w-[56ch] text-step-0 leading-relaxed">{section.body}</p>
            </div>
            {section.image && size ? (
              <figure className="md:col-span-8">
                <Image
                  src={section.image.src}
                  alt={section.image.alt}
                  width={size[0]}
                  height={size[1]}
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="h-auto w-full border border-current/20"
                />
                <figcaption className="mt-3 text-step--1 opacity-80">{section.image.caption}</figcaption>
              </figure>
            ) : null}
          </section>
        );
      })}

      <section aria-labelledby="decisions" className="border-t border-current/30 py-16">
        <h2 id="decisions" className="text-step-1 font-medium">
          {labels.decisions}
        </h2>
        <ul className="mt-8 grid gap-10 md:grid-cols-3">
          {study.decisions.map((decision) => (
            <li key={decision.title}>
              <h3 className="text-step-1 leading-snug font-medium">{decision.title}</h3>
              <p className="mt-3 max-w-[46ch] text-step-0 leading-relaxed">{decision.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="outcome" className="border-t border-current/30 py-16">
        <h2 id="outcome" className="text-step-1 font-medium">
          {labels.outcome}
        </h2>
        <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {study.outcome.map((item) => (
            <div key={item.label} className="flex flex-col-reverse gap-2">
              <dt className="max-w-[24ch] text-step-0 leading-snug">{item.label}</dt>
              <dd className="tabular font-display text-step-4 leading-none font-light [font-variation-settings:'wdth'_120]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 flex flex-col gap-4">
          {station === "hub" ? <p className="max-w-[60ch] text-step-0 opacity-80">{labels.privateNote}</p> : null}
          <a
            href={meta.href}
            target="_blank"
            rel="noreferrer"
            className="self-start text-step-1 underline decoration-1 underline-offset-8 hover:decoration-2"
          >
            {copy.linkLabel}
          </a>
        </div>
      </section>

      <nav aria-label={labels.next} className="border-t border-current/30 pt-10 pb-24">
        <Link href={`/${lang}/work/${nextId}`} className="group block">
          <span className="text-step-0 opacity-80">{labels.next}</span>
          <span
            className={`mt-2 block font-display text-step-5 leading-none underline decoration-1 underline-offset-8 group-hover:decoration-2 ${nameCut[nextId]}`}
          >
            {dict.stations[nextId].name}
          </span>
        </Link>
      </nav>
    </article>
  );
}
