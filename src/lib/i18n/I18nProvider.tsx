"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Locale, LocalizedText } from "@/lib/types";
import { dict, type DictKey } from "./dict";

const LOCALE_KEY = "sm_locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** translate a dictionary key */
  t: (key: DictKey) => string;
  /** render a LocalizedText value */
  tl: (text: LocalizedText) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LOCALE_KEY) : null;
    return stored === "ko" || stored === "en" ? stored : "ko";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem(LOCALE_KEY, l);
  }, []);

  const t = useCallback((key: DictKey) => dict[key][locale], [locale]);
  const tl = useCallback((text: LocalizedText) => text[locale], [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
