"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/components/i18n/LanguageProvider";

const ranges = [
  { id: "7d" },
  { id: "30d" },
  { id: "90d" },
  { id: "all" },
];

function formatDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rangeLabel(activeRange: string, locale: "zh" | "en"): string {
  if (activeRange === "all") return locale === "zh" ? "全部历史" : "All history";
  const days = activeRange === "7d" ? 7 : activeRange === "90d" ? 90 : 30;
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);
  return `${formatDate(start)}  ~  ${formatDate(end)}`;
}

export function TopBar() {
  const { dictionary, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRange = searchParams.get("range") || "30d";

  const pageMeta = pathname.includes("/overview-preview")
    ? dictionary.topBar.pages.overview
    : pathname.includes("/analytics")
    ? dictionary.topBar.pages.analytics
    : pathname.includes("/settings")
      ? dictionary.topBar.pages.settings
      : pathname.includes("/performance") && searchParams.get("view") === "trades"
        ? dictionary.topBar.pages.trades
      : dictionary.topBar.pages.performance;

  function handleRangeChange(range: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`?${params.toString()}`);
  }

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-[rgba(8,17,29,0.88)] px-4 py-3 backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-tertiary/90 p-1">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRangeChange(r.id)}
              aria-pressed={activeRange === r.id}
              className={`min-w-12 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 ${
                activeRange === r.id
                  ? "bg-yellow text-[#08111D] shadow-[0_0_18px_rgba(245,179,26,0.18)]"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              {dictionary.topBar.ranges[r.id as keyof typeof dictionary.topBar.ranges]}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-bg-tertiary/90 px-3 py-2 font-mono text-xs font-medium text-text-secondary">
          <span>{rangeLabel(activeRange, locale)}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-text-muted">
            <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="hidden min-w-0 text-xs font-medium text-text-muted xl:block">
          <span className="text-text-secondary">{pageMeta.title}</span>
          <span className="mx-2 text-border">/</span>
          {pageMeta.subtitle}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={dictionary.topBar.refreshAria}
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-tertiary/90 px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-yellow/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M20 12a8 8 0 01-13.66 5.66M4 12A8 8 0 0117.66 6.34M18 3v4h-4M6 21v-4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {dictionary.topBar.refresh}
        </button>
        <LanguageToggle />
      </div>
    </div>
  );
}
