import "server-only";
import type { Locale } from "./config";

const dictionaries = {
  es: () => import("./dictionaries/es.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["es"]>>;

export const getDictionary = (locale: Locale): Promise<Dictionary> => dictionaries[locale]();

const cases = {
  es: () => import("./cases/es.json").then((m) => m.default),
  en: () => import("./cases/en.json").then((m) => m.default),
};

export type Cases = Awaited<ReturnType<(typeof cases)["es"]>>;

export const getCases = (locale: Locale): Promise<Cases> => cases[locale]();
