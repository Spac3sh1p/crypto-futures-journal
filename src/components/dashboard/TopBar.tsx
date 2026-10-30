"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePendingNavigation, useTradeNavigation } from "@/components/dashboard/TradeNavigationGuard";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { normalizeMonthParam } from "@/lib/dashboard/calendar-transforms";
import { formatTradeDateTimeParts } from "@/lib/formatters";
import type { Locale } from "@/lib/i18n";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { refreshWalletBalance } from "@/app/dashboard/actions";

const RANGES = ["7d", "30d", "90d", "all"] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(year, monthNumber - 1 + delta, 1);
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;
}

/** 区间起止日期和交易表用同一种写法（中文 2026/10/30，英文 30/Oct/26） */
function rangeSpan(activeRange: string, locale: Locale): string | null {
  if (activeRange === "all") return null;
  const days = activeRange === "7d" ? 7 : activeRange === "90d" ? 90 : 30;
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);
  return `${formatTradeDateTimeParts(start, locale).date} – ${formatTradeDateTimeParts(end, locale).date}`;
}

export function TopBar() {
  const { dictionary, locale } = useI18n();
  const router = useRouter();
  const { requestNavigation, pending } = useTradeNavigation();
  const [isNavigating, startNavigation] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  usePendingNavigation(isNavigating);
  usePendingNavigation(isRefreshing);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRange = searchParams.get("range") || "30d";
  const isCalendar = pathname === "/dashboard/calendar";
  const isSettings = pathname === "/dashboard/settings";
  const isTradesView = pathname === "/dashboard/performance" && searchParams.get("view") === "trades";
  const activeMonth = normalizeMonthParam(searchParams.get("month") ?? undefined);

  const title = isCalendar
    ? (locale === "zh" ? "月度复盘" : "Monthly Review")
    : pathname === "/dashboard/analytics"
      ? dictionary.topBar.pages.analytics.title
      : isSettings
        ? dictionary.topBar.pages.settings.title
        : isTradesView
          ? dictionary.topBar.pages.trades.title
          : dictionary.topBar.pages.performance.title;
  const showRange = !isCalendar && !isSettings;

  function handleRangeChange(range: string) {
    if (!requestNavigation()) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    ["month", "page", "tradeId", "exitDate"].forEach((key) => params.delete(key));
    startNavigation(() => router.push(`?${params.toString()}`));
  }

  function handleMonthChange(month: string) {
    if (!requestNavigation() || !month) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", normalizeMonthParam(month));
    params.delete("range");
    startNavigation(() => router.push(`?${params.toString()}`));
  }

  async function handleRefresh() {
    if (!requestNavigation()) return;
    try {
      await refreshWalletBalance();
    } catch {
      // 清缓存失败不影响刷新本身
    }
    startRefresh(() => router.refresh());
  }

  const span = rangeSpan(activeRange, locale);

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line-strong bg-canvas px-6">
      <div className="flex min-w-0 items-center gap-4">
        <h1 className="shrink-0 text-[15px] font-semibold text-ink">{title}</h1>
        {isCalendar && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={locale === "zh" ? "上个月" : "Previous month"}
              onClick={() => handleMonthChange(shiftMonth(activeMonth, -1))}
              className="ui-button h-8 w-8 justify-center px-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <input
              type="month"
              value={activeMonth}
              onChange={(event) => handleMonthChange(event.target.value)}
              aria-label={locale === "zh" ? "选择月份" : "Select month"}
              className="ui-field ui-num min-w-[132px]"
            />
            <button
              type="button"
              aria-label={locale === "zh" ? "下个月" : "Next month"}
              onClick={() => handleMonthChange(shiftMonth(activeMonth, 1))}
              className="ui-button h-8 w-8 justify-center px-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}
        {showRange && (
          <>
            <div className="ui-segmented" role="group" aria-label={dictionary.topBar.pages.performance.title}>
              {RANGES.map((range) => (
                <button key={range} type="button" aria-pressed={activeRange === range} onClick={() => handleRangeChange(range)}>
                  {dictionary.topBar.ranges[range]}
                </button>
              ))}
            </div>
            {span && <span className="ui-num hidden text-[12px] text-ink-3 lg:inline">{span}</span>}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <LanguageToggle />
        <button type="button" aria-label={dictionary.topBar.refreshAria} aria-busy={isRefreshing} onClick={handleRefresh} className="ui-button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={isRefreshing ? "animate-spin" : undefined}>
            <path d="M20 12a8 8 0 01-13.66 5.66M4 12A8 8 0 0117.66 6.34M18 3v4h-4M6 21v-4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {dictionary.topBar.refresh}
        </button>
      </div>

      {pending && <div className="ui-progress" role="progressbar" aria-label={dictionary.common.loading} />}
    </header>
  );
}
