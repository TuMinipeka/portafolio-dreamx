import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getCases, getDictionary } from "@/i18n/dictionaries";
import { social, stations, tools } from "@/content/flight";
import { siteUrl } from "@/lib/site";
import { Hero } from "@/components/sections/Hero";
import { Logbook } from "@/components/sections/Logbook";
import { FlightPlan } from "@/components/sections/FlightPlan";
import { Station } from "@/components/sections/Station";
import { Contact } from "@/components/sections/Contact";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dict, cases] = await Promise.all([getDictionary(lang), getCases(lang)]);

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: dict.hero.name,
    jobTitle: dict.hero.role,
    description: dict.hero.intro,
    url: `${siteUrl}/${lang}`,
    email: `mailto:${social.email}`,
    sameAs: [social.linkedin, social.github],
    knowsAbout: tools,
    knowsLanguage: ["es", "en"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape every "<" as a JSON unicode escape so the data can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, String.fromCharCode(92) + "u003c") }}
      />
      <Hero dict={dict} />
      <Logbook copy={dict.log} />
      <FlightPlan copy={dict.about} />
      {stations.map((station) => (
        <Station
          key={station.id}
          station={station}
          copy={dict.stations[station.id]}
          labels={dict.station}
          lang={lang}
          openLabel={cases.labels.open}
        />
      ))}
      <Contact copy={dict.contact} />
    </>
  );
}
