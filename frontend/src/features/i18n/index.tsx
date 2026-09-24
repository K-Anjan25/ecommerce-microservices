import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import ar from "./locales/ar";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";
import hi from "./locales/hi";
import ja from "./locales/ja";
import ko from "./locales/ko";
import nl from "./locales/nl";
import sv from "./locales/sv";
import type { MessageKey, Messages } from "./types";

export type Language = "en" | "hi" | "de" | "fr" | "nl" | "es" | "sv" | "ar" | "ja" | "ko";

const STORAGE_KEY = "cartly-language";
const messages: Record<Language, Messages> = { en, hi, de, fr, nl, es, sv, ar, ja, ko };

/**
 * Languages mirror the countries Cartly ships to (commerce-service
 * `ShippingZoneSeeder`): India (en, hi), Germany & Switzerland (de),
 * France/Belgium/Switzerland (fr), Netherlands/Belgium (nl), Spain (es),
 * Sweden (sv), UAE (ar, RTL), Japan (ja), South Korea (ko).
 * English also covers US, CA, GB, SG, AU and NZ.
 */
export const LANGUAGES: { code: Language; native: string; short: string; rtl?: boolean }[] = [
  { code: "en", native: "English", short: "EN" },
  { code: "hi", native: "हिन्दी", short: "HI" },
  { code: "de", native: "Deutsch", short: "DE" },
  { code: "fr", native: "Français", short: "FR" },
  { code: "nl", native: "Nederlands", short: "NL" },
  { code: "es", native: "Español", short: "ES" },
  { code: "sv", native: "Svenska", short: "SV" },
  { code: "ar", native: "العربية", short: "AR", rtl: true },
  { code: "ja", native: "日本語", short: "JA" },
  { code: "ko", native: "한국어", short: "KO" },
];

const LOCALES: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
  de: "de-DE",
  fr: "fr-FR",
  nl: "nl-NL",
  es: "es-ES",
  sv: "sv-SE",
  ar: "ar-AE",
  ja: "ja-JP",
  ko: "ko-KR",
};

const isLanguage = (value: string | null): value is Language =>
  LANGUAGES.some((l) => l.code === value);

type I18nValue = {
  language: Language;
  locale: string;
  rtl: boolean;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : "en";
  });

  const rtl = language === "ar";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    // Arabic reads right-to-left; flex/grid layouts mirror automatically.
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [language, rtl]);

  const value = useMemo<I18nValue>(
    () => ({
      language,
      locale: LOCALES[language],
      rtl,
      setLanguage,
      t: (key) => messages[language][key] ?? en[key],
    }),
    [language, rtl]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export type { MessageKey };
