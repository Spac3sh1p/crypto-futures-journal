"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTradeNavigation } from "@/components/dashboard/TradeNavigationGuard";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { normalizeMonthParam } from "@/lib/dashboard/calendar-transforms";
import { LanguageToggleV2 } from "./LanguageToggleV2";

const RANGES = ["7d", "30d", "90d", "all"] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDate(value: Date): string {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(year, monthNumber - 1 + delta, 1);
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;
}

function rangeSpan(activeRange: string): string | null {
  if (activeRange === "all") return null;
  const days = activeRange === "7d" ? 7 : activeRange === "90d" ? 90 : 30;
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function TopBarV2() {
  const { dictionary, locale } = useI18n();
  const router = useRouter();
  const { requestNavigation } = useTradeNavigation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRange = searchParams.get("range") || "30d";
  const isCalendar = pathname === "/preview/calendar";
  const activeMonth = normalizeMonthParam(searchParams.get("month") ?? undefined);

  const title = isCalendar
    ? (locale === "zh" ? "月度复盘" : "Monthly Review")
    : pathname === "/preview/analytics"
      ? dictionary.topBar.pages.analytics.title
      : pathname === "/preview/settings"
        ? dictionary.topBar.pages.settings.title
        : pathname === "/preview/trades"
          ? dictionary.topBar.pages.trades.title
          : dictionary.topBar.pages.performance.title;
  const showRange = !isCalendar && pathname !== "/preview/settings";

  function handleRangeChange(range: string) {
    if (!requestNavigation()) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    ["month", "page", "tradeId", "exitDate"].forEach((key) => params.delete(key));
    router.push(`?${params.toString()}`);
  }

  function handleMonthChange(month: string) {
    if (!requestNavigation() || !month) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", normalizeMonthParam(month));
    params.delete("range");
    router.push(`?${params.toString()}`);
  }

  function handleRefresh() {
    if (!requestNavigation()) return;
    router.refresh();
  }

  const span = rangeSpan(activeRange);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line-strong bg-canvas px-6">
      <div className="flex min-w-0 items-center gap-4">
        <h1 className="shrink-0 text-[15px] font-semibold text-ink">{title}</h1>
        {isCalendar && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={locale === "zh" ? "上个月" : "Previous month"}
              onClick={() => handleMonthChange(shiftMonth(activeMonth, -1))}
              className="v2-button h-8 w-8 justify-center px-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <input
              type="month"
              value={activeMonth}
              onChange={(event) => handleMonthChange(event.target.value)}
              aria-label={locale === "zh" ? "选择月份" : "Select month"}
              className="v2-field v2-num min-w-[132px]"
            />
            <button
              type="button"
              aria-label={locale === "zh" ? "下个月" : "Next month"}
              onClick={() => handleMonthChange(shiftMonth(activeMonth, 1))}
              className="v2-button h-8 w-8 justify-center px-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}
        {showRange && (
          <>
            <div className="v2-segmented" role="group" aria-label={dictionary.topBar.pages.performance.title}>
              {RANGES.map((range) => (
                <button key={range} type="button" aria-pressed={activeRange === range} onClick={() => handleRangeChange(range)}>
                  {dictionary.topBar.ranges[range]}
                </button>
              ))}
            </div>
            {span && <span className="v2-num hidden text-[12px] text-ink-3 lg:inline">{span}</span>}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <LanguageToggleV2 />
        <button type="button" aria-label={dictionary.topBar.refreshAria} onClick={handleRefresh} className="v2-button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 12a8 8 0 01-13.66 5.66M4 12A8 8 0 0117.66 6.34M18 3v4h-4M6 21v-4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {dictionary.topBar.refresh}
        </button>
      </div>
    </header>
  );
}
