import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { stations } from "@/content/flight";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/quick", ...stations.map((s) => `/work/${s.id}`)];
  return paths.map((path) => ({
    url: `${siteUrl}/es${path}`,
    lastModified: new Date(),
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])) },
  }));
}
