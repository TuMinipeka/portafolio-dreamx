"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";

export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const target: Locale = locale === "es" ? "en" : "es";
  const href = pathname.replace(/^\/(es|en)(?=\/|$)/, `/${target}`);

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      className="text-step--1 underline decoration-1 underline-offset-4 hover:decoration-2"
    >
      {label}
    </Link>
  );
}
