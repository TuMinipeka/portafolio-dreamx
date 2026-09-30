import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { stations } from "@/content/flight";
import { Hero } from "@/components/sections/Hero";
import { Station } from "@/components/sections/Station";
import { Contact } from "@/components/sections/Contact";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <Hero copy={dict.hero} />
      {stations.map((station) => (
        <Station
          key={station.id}
          station={station}
          copy={dict.stations[station.id]}
          labels={dict.station}
        />
      ))}
      <Contact copy={dict.contact} />
    </>
  );
}
