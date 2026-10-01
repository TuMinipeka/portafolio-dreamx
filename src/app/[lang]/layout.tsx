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
import { WorldMount } from "@/components/world/WorldMount";
import { CommandPalette } from "@/components/chrome/CommandPalette";
import { SoundToggle } from "@/components/chrome/SoundToggle";
import { TransitionLayer } from "@/components/transition/TransitionLayer";
import { siteUrl } from "@/lib/site";
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
// script strips the build on the home page so the visitor watches it compile, unless they
// prefer reduced motion, in which case the page is locked in its built state.
const FULL_BUILD = "layout type color motion";
const startUnbuilt = `(function(){var d=document.documentElement;if(location.pathname.split("/").filter(Boolean).length!==1)return;try{if(matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-locked","");return}}catch(e){}d.setAttribute("data-build","");d.style.setProperty("--build","0")})()`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(siteUrl),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: { languages: { es: "/es", en: "/en" } },
    icons: { icon: "/brand/dreamx-logo.png" },
    openGraph: { type: "website", locale: lang === "es" ? "es_CO" : "en_US", siteName: "Daniel Mayorga" },
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
          className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-linear-to-b from-(--sky) from-40% to-transparent px-5 pt-4 pb-8 text-(--ink) md:px-8"
        >
          <Link href={`/${lang}`} aria-label={dict.chrome.home}>
            <LogoMark className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-5 md:gap-7">
            <Link
              href={`/${lang}/quick`}
              className="hidden text-step--1 underline decoration-1 underline-offset-4 hover:decoration-2 sm:inline"
            >
              {dict.quick.title}
            </Link>
            <SoundToggle copy={dict.chrome.sound} />
            <CommandPalette lang={lang} dict={dict} />
            <LocaleSwitch locale={lang} label={dict.chrome.switchLocale} />
          </div>
        </header>

        <WorldMount />
        <main id="main" className="relative z-10">
          {children}
        </main>
        <TransitionLayer arrivedLabel={dict.chrome.arrived} />

        <Altimeter locale={lang} layers={dict.layers} />
        <SmoothScroll />
        <SkyController />
      </body>
    </html>
  );
}
