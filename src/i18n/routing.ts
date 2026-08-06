import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "bs", "hr", "sr", "de", "sv", "nl"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  bs: "Bosanski",
  hr: "Hrvatski",
  sr: "Srpski",
  de: "Deutsch",
  sv: "Svenska",
  nl: "Nederlands",
};
