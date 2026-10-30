"use client";

import { useI18n } from "@/components/i18n/LanguageProvider";
import { Segmented } from "@/components/ui/Segmented";
import type { Locale } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, dictionary, setLocale } = useI18n();
  return (
    <Segmented<Locale>
      ariaLabel={dictionary.language.label}
      value={locale}
      onChange={setLocale}
      options={[
        { value: "zh", label: dictionary.language.chinese },
        { value: "en", label: dictionary.language.english },
      ]}
    />
  );
}
