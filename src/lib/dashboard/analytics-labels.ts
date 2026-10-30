import type { Locale } from "@/lib/i18n";

/** 持仓时长分组标签：去掉为 0 的单位（"> 0d 1h 55m" → "> 1h 55m"），中文再翻译单位。 */
export function formatDurationBucketLabel(label: string, locale: Locale): string {
  const compact = label
    .replace(/\b0[dhms]\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (locale !== "zh") return compact;
  return compact
    .replace(/(\d+)d/g, "$1天")
    .replace(/(\d+)h/g, "$1小时")
    .replace(/(\d+)m/g, "$1分")
    .replace(/(\d+)s/g, "$1秒");
}
