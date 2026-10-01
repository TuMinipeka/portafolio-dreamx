import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { social, stations, tools } from "@/content/flight";
import { BuildComplete } from "@/components/case/BuildComplete";

export async function generateMetadata({ params }: PageProps<"/[lang]/quick">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.quick.meta,
    description: dict.hero.intro,
    alternates: { languages: { es: "/es/quick", en: "/en/quick" } },
  };
}

/**
 * The recruiter's version: no flight, no 3D, everything on one screen and a half.
 * Parked on the ground so the sky stays quiet.
 */
export default async function QuickPage({ params }: PageProps<"/[lang]/quick">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const q = dict.quick;

  const contact = [
    { href: `mailto:${social.email}`, label: social.email },
    { href: social.linkedin, label: "LinkedIn" },
    { href: social.github, label: "GitHub" },
    { href: social.cv, label: dict.contact.cv },
  ];

  return (
    <article data-station-page="hero" className="mx-auto max-w-5xl px-5 pt-28 pb-24 md:px-8">
      <BuildComplete />

      <header className="grid gap-6 border-b border-current/30 pb-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="text-step--1 opacity-80">{q.title}</p>
          <h1 className="mt-2 font-display text-step-4 leading-none font-bold [font-variation-settings:'wdth'_80]">
            {dict.hero.name}
          </h1>
          <p className="mt-3 text-step-1">{dict.hero.role}</p>
          <p className="mt-6 max-w-[52ch] text-step-0 leading-relaxed">{dict.about.intro}</p>
          <p className="mt-4 max-w-[52ch] text-step-0 leading-relaxed">
            <span className="opacity-80">{dict.about.seekingLabel}: </span>
            {dict.about.seeking}
          </p>
        </div>
        <div className="md:col-span-4 md:col-start-9">
          <h2 className="text-step--1 opacity-80">{q.contact}</h2>
          <ul className="mt-2 grid gap-1.5 text-step-0">
            {contact.map((c) => (
              <li key={c.href}>
                <a
                  href={c.href}
                  target={c.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="break-all underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <section aria-labelledby="quick-projects" className="border-b border-current/30 py-10">
        <h2 id="quick-projects" className="text-step-1 font-medium">
          {q.projects}
        </h2>
        <ul className="mt-6 grid gap-8">
          {stations.map((s) => {
            const copy = dict.stations[s.id];
            return (
              <li key={s.id} className="grid gap-2 md:grid-cols-12 md:gap-6">
                <div className="md:col-span-4">
                  <h3 className="font-display text-step-2 leading-tight font-semibold [font-variation-settings:'wdth'_90]">
                    {copy.name}
                  </h3>
                  <p className="mt-1 text-step-0 opacity-80">{copy.kind}</p>
                </div>
                <div className="grid gap-2 text-step-0 leading-relaxed md:col-span-8">
                  <p>{copy.summary}</p>
                  <p>
                    <span className="opacity-80">{dict.station.role}: </span>
                    {copy.role}
                  </p>
                  <p className="opacity-80">{s.stack.join(", ")}</p>
                  <Link
                    href={`/${lang}/work/${s.id}`}
                    className="self-start underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    {q.seeCase}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="quick-trajectory" className="grid gap-6 border-b border-current/30 py-10 md:grid-cols-12">
        <h2 id="quick-trajectory" className="text-step-1 font-medium md:col-span-4">
          {q.trajectory}
        </h2>
        <ol className="grid gap-4 md:col-span-8">
          {dict.log.entries.map((e) => (
            <li key={e.when} className="grid gap-1">
              <p className="tabular text-step--1 opacity-80">{e.when}</p>
              <p className="text-step-0 font-medium">{e.where}</p>
            </li>
          ))}
        </ol>
      </section>

      <dl className="grid gap-6 py-10 text-step-0 md:grid-cols-12">
        <div className="md:col-span-8">
          <dt className="text-step--1 opacity-80">{dict.log.toolsLabel}</dt>
          <dd className="mt-1">{tools.join(", ")}</dd>
        </div>
        <div className="md:col-span-8">
          <dt className="text-step--1 opacity-80">{dict.about.learningLabel}</dt>
          <dd className="mt-1">{dict.about.learning.join(", ")}</dd>
        </div>
        <div className="md:col-span-4">
          <dt className="text-step--1 opacity-80">{dict.log.languagesLabel}</dt>
          <dd className="mt-1">{dict.log.languages}</dd>
        </div>
      </dl>

      <Link href={`/${lang}`} className="text-step-1 underline decoration-1 underline-offset-8 hover:decoration-2">
        {q.full}
      </Link>
    </article>
  );
}
