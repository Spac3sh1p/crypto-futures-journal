"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n/LanguageProvider";

function IconPerformance({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconAnalytics({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 9h16" />
      <path d="M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
      <path d="M8 13h.01" />
      <path d="M12 13h.01" />
      <path d="M16 13h.01" />
      <path d="M8 17h.01" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconTrades({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard/performance", id: "performance", labelKey: "performance" as const, Icon: IconPerformance },
  { href: "/dashboard/calendar", id: "calendar", Icon: IconCalendar },
  { href: "/dashboard/analytics", id: "analytics", labelKey: "analytics" as const, Icon: IconAnalytics },
  { href: "/dashboard/performance?view=trades", id: "trades", labelKey: "performance" as const, Icon: IconTrades },
  { href: "/dashboard/settings", id: "settings", labelKey: "settings" as const, Icon: IconSettings },
];

interface SidebarExchange {
  id: string;
  name: string;
  label: string | null;
  isActive: boolean;
  _count?: {
    trades: number;
  };
}

function formatExchangeName(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized === "bybit") return "Bybit";
  if (normalized === "binance") return "Binance";
  if (normalized === "hyperliquid") return "Hyperliquid";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function exchangeAccent(name: string): { bg: string; text: string; mark: string } {
  const normalized = name.toLowerCase();
  if (normalized === "bybit") {
    return { bg: "bg-yellow/12", text: "text-yellow", mark: "Y" };
  }
  if (normalized === "hyperliquid") {
    return { bg: "bg-green-dim", text: "text-green", mark: "H" };
  }
  return { bg: "bg-yellow/12", text: "text-yellow", mark: "B" };
}

function buildScopedHref(baseHref: string, searchParams: URLSearchParams): string {
  const [path, rawQuery] = baseHref.split("?");
  const params = new URLSearchParams(rawQuery ?? "");
  const exchangeId = searchParams.get("exchangeId");
  const range = searchParams.get("range");
  const month = searchParams.get("month");

  if (exchangeId) params.set("exchangeId", exchangeId);
  if (range && (path.includes("/performance") || path.includes("/analytics"))) {
    params.set("range", range);
  }
  if (month && path.includes("/calendar")) {
    params.set("month", month);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function Sidebar({ exchanges = [] }: { exchanges?: SidebarExchange[] }) {
  const { dictionary, locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const currentView = searchParams.get("view");
  const selectedExchangeId = searchParams.get("exchangeId");
  const sourceText = locale === "zh"
    ? { source: "数据源", all: "全部交易所", allScope: "汇总交易记录", futures: "U 本位合约", sync: "本地只读同步", empty: "暂无交易所连接", trades: "笔交易" }
    : { source: "Data Source", all: "All exchanges", allScope: "Combined trade records", futures: "USDT Futures", sync: "Local read-only sync", empty: "No exchange connected", trades: "trades" };

  const activeExchanges = exchanges.filter((exchange) => exchange.isActive);
  const selectedExchange = activeExchanges.find((exchange) => exchange.id === selectedExchangeId);

  function buildExchangeHref(exchangeId: string | null): string {
    const params = new URLSearchParams(searchParamString);
    if (exchangeId) {
      params.set("exchangeId", exchangeId);
    } else {
      params.delete("exchangeId");
    }
    params.delete("tradeId");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <aside className="flex h-full w-20 shrink-0 flex-col border-r border-border bg-[linear-gradient(180deg,rgba(13,23,37,0.98),rgba(7,16,27,0.98))] sm:w-64">
      <div className="border-b border-border px-4 py-5 sm:px-6">
        <h1 className="hidden text-base font-bold tracking-wide text-text-primary sm:block">
          {dictionary.common.appName}
        </h1>
        <h1 className="text-center text-xs font-bold uppercase tracking-[0.12em] text-yellow sm:hidden">
          {dictionary.common.appShortName}
        </h1>
      </div>

      <nav className="flex-1 space-y-1 p-3 sm:p-4" aria-label={dictionary.common.dashboard}>
        <div className="hidden px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted sm:block">
          {dictionary.common.dashboard}
        </div>
        {navItems.map((item) => {
          const isTrades = pathname === "/dashboard/performance" && currentView === "trades";
          const isActive = item.id === "trades"
            ? isTrades
            : item.id === "performance"
              ? pathname === "/dashboard/performance" && currentView !== "trades"
              : item.id === "calendar"
                ? pathname === "/dashboard/calendar"
                : pathname === item.href;
          const label = item.id === "trades"
            ? (locale === "zh" ? "交易记录" : "Trade Records")
            : item.id === "calendar"
              ? (locale === "zh" ? "月度复盘" : "Monthly Review")
              : item.labelKey ? dictionary.nav[item.labelKey] : "";
          return (
            <Link
              key={item.href}
              href={buildScopedHref(item.href, new URLSearchParams(searchParamString))}
              title={label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 sm:justify-start ${
                isActive
                  ? "border border-yellow/20 bg-[linear-gradient(90deg,rgba(245,179,26,0.22),rgba(245,179,26,0.07))] text-yellow shadow-[inset_3px_0_0_var(--yellow)]"
                  : "text-text-secondary hover:bg-bg-hover/70 hover:text-text-primary"
              }`}
            >
              <item.Icon className={isActive ? "text-yellow" : "text-text-muted"} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden p-4 sm:block">
        <div className="rounded-xl border border-border bg-bg-tertiary/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">{sourceText.source}</div>
          <div className="mt-3 space-y-2">
            <Link
              href={buildExchangeHref(null)}
              aria-current={!selectedExchangeId ? "true" : undefined}
              className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 ${
                !selectedExchangeId
                  ? "border-yellow/30 bg-yellow/12 text-text-primary"
                  : "border-border-light bg-bg-primary/40 text-text-secondary hover:border-yellow/30 hover:text-text-primary"
              }`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-text-muted/10 text-text-secondary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{sourceText.all}</span>
                <span className="block truncate text-[11px] font-medium text-text-muted">{sourceText.allScope}</span>
              </span>
            </Link>

            {activeExchanges.length === 0 ? (
              <div className="rounded-lg border border-border-light bg-bg-primary/35 px-3 py-2 text-[11px] font-medium text-text-muted">
                {sourceText.empty}
              </div>
            ) : (
              activeExchanges.map((exchange) => {
                const isSelected = exchange.id === selectedExchangeId;
                const accent = exchangeAccent(exchange.name);
                const displayName = formatExchangeName(exchange.name);
                const title = exchange.label ? `${displayName} · ${exchange.label}` : displayName;
                return (
                  <Link
                    key={exchange.id}
                    href={buildExchangeHref(exchange.id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 ${
                      isSelected
                        ? "border-yellow/30 bg-[linear-gradient(90deg,rgba(245,179,26,0.16),rgba(245,179,26,0.05))] text-text-primary shadow-[inset_3px_0_0_var(--yellow)]"
                        : "border-border-light bg-bg-primary/40 text-text-secondary hover:border-yellow/30 hover:text-text-primary"
                    }`}
                  >
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${accent.bg} ${accent.text}`}>
                      <span className="text-[11px] font-bold">{accent.mark}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{title}</span>
                      <span className="block truncate text-[11px] font-medium text-text-muted">
                        {exchange._count?.trades ?? 0} {sourceText.trades} · {sourceText.futures}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
          <div className="mt-4 border-t border-border-light pt-3 text-[11px] font-medium text-text-muted">
            {selectedExchange ? formatExchangeName(selectedExchange.name) : sourceText.sync}
          </div>
        </div>
      </div>
    </aside>
  );
}
