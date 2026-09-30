import type { Metadata } from "next";
import { Anybody, Instrument_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import Link from "next/link";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { SkyController } from "@/components/providers/SkyController";
import { Altimeter } from "@/components/chrome/Altimeter";
import { LocaleSwitch } from "@/components/chrome/LocaleSwitch";
import { LogoMark } from "@/components/chrome/LogoMark";
import "../globals.css";

const anybody = Anybody({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-anybody",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-instrument",
});

// Server HTML ships fully built (works without JS). Before first paint this
// script strips the build so the visitor watches it compile, unless they
// prefer reduced motion, in which case the page is locked in its built state.
const FULL_BUILD = "layout type color motion";
const startUnbuilt = `(function(){var d=document.documentElement;try{if(matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-locked","");return}}catch(e){}d.setAttribute("data-build","")})()`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: { languages: { es: "/es", en: "/en" } },
    icons: { icon: "/brand/dreamx-logo.png" },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${anybody.variable} ${instrument.variable}`}
      data-build={FULL_BUILD}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: startUnbuilt }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-(--color-runway) focus:px-3 focus:py-2 focus:text-(--color-graphite)"
        >
          {dict.chrome.skip}
        </a>

        <header
          data-chrome
          className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 text-(--ink) md:px-8">
          <Link href={`/${lang}`} aria-label={dict.chrome.home}>
            <LogoMark className="h-7 w-auto" />
          </Link>
          <LocaleSwitch locale={lang} label={dict.chrome.switchLocale} />
        </header>

        <main id="main">{children}</main>

        <Altimeter locale={lang} layers={dict.layers} />
        <SmoothScroll />
        <SkyController />
      </body>
    </html>
  );
}
