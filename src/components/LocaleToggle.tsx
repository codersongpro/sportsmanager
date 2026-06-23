"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex rounded-full border border-zinc-300 text-xs dark:border-zinc-700">
      <button
        onClick={() => setLocale("ko")}
        className={`rounded-full px-2.5 py-1 ${locale === "ko" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black" : ""}`}
      >
        한국어
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded-full px-2.5 py-1 ${locale === "en" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black" : ""}`}
      >
        EN
      </button>
    </div>
  );
}
