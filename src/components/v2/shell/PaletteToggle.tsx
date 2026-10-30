"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { PREVIEW_PALETTE_COOKIE, type PreviewPalette } from "@/lib/dashboard/preview-routing";
import { Segmented } from "@/components/v2/ui/Segmented";

export function PaletteToggle({ palette }: { palette: PreviewPalette }) {
  const router = useRouter();
  const { dictionary } = useI18n();
  const text = dictionary.preview;

  function handleChange(next: PreviewPalette) {
    document.cookie = `${PREVIEW_PALETTE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    document.querySelector<HTMLElement>("[data-ui='v2']")?.setAttribute("data-palette", next);
    router.refresh();
  }

  return (
    <Segmented
      ariaLabel={text.palette}
      value={palette}
      onChange={handleChange}
      options={[
        { value: "ink", label: text.paletteInk },
        { value: "slate", label: text.paletteSlate },
      ]}
    />
  );
}
