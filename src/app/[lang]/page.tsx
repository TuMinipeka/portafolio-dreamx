import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getCases, getDictionary } from "@/i18n/dictionaries";
import { stations } from "@/content/flight";
import { Hero } from "@/components/sections/Hero";
import { Logbook } from "@/components/sections/Logbook";
import { Station } from "@/components/sections/Station";
import { Contact } from "@/components/sections/Contact";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dict, cases] = await Promise.all([getDictionary(lang), getCases(lang)]);

  return (
    <>
      <Hero dict={dict} />
      <Logbook copy={dict.log} />
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
