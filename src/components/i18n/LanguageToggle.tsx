"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";

export function LanguageToggle() {
  const { locale, dictionary, setLocale } = useI18n();
  const nextLocale = locale === "zh" ? "en" : "zh";

  return (
    <button
      type="button"
      aria-label={nextLocale === "en" ? dictionary.language.switchToEnglish : dictionary.language.switchToChinese}
      onClick={() => setLocale(nextLocale)}
      className="inline-flex h-9 items-center rounded-lg border border-border bg-bg-tertiary/90 p-1 text-[11px] font-semibold text-text-secondary transition-colors hover:border-yellow/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
    >
      <span
        className={`rounded-md px-2 py-1 transition-colors ${
          locale === "zh" ? "bg-yellow text-[#08111D]" : "hover:text-text-primary"
        }`}
      >
        {dictionary.language.chinese}
      </span>
      <span
        className={`rounded-md px-2 py-1 transition-colors ${
          locale === "en" ? "bg-yellow text-[#08111D]" : "hover:text-text-primary"
        }`}
      >
        {dictionary.language.english}
      </span>
    </button>
  );
}
