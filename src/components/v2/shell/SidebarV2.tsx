"use client";

import { TradeNavigationLink as Link } from "@/components/dashboard/TradeNavigationGuard";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { toDashboardHref } from "@/lib/dashboard/preview-routing";

interface SidebarExchange {
  id: string;
  name: string;
  label: string | null;
  isActive: boolean;
  _count?: { trades: number };
}

type IconProps = { className?: string };

function IconPerformance({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 17l5-6 4 3 5-7 4 4" />
    </svg>
  );
}

function IconCalendar({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </svg>
  );
}

function IconAnalytics({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 20V11M12 20V4M19 20v-7" />
    </svg>
  );
}

function IconTrades({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

function IconSettings({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </svg>
  );
}

const NAV = [
  { id: "performance", href: "/preview", Icon: IconPerformance },
  { id: "calendar", href: "/preview/calendar", Icon: IconCalendar },
  { id: "analytics", href: "/preview/analytics", Icon: IconAnalytics },
  { id: "trades", href: "/preview/trades", Icon: IconTrades },
  { id: "settings", href: "/preview/settings", Icon: IconSettings },
] as const;

function formatExchangeName(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized === "bybit") return "Bybit";
  if (normalized === "binance") return "Binance";
  if (normalized === "hyperliquid") return "Hyperliquid";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function scopedHref(path: string, searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  const exchangeId = searchParams.get("exchangeId");
  const range = searchParams.get("range");
  const month = searchParams.get("month");
  if (exchangeId) params.set("exchangeId", exchangeId);
  if (range && (path === "/preview" || path === "/preview/analytics" || path === "/preview/trades")) params.set("range", range);
  if (month && path === "/preview/calendar") params.set("month", month);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function SidebarV2({ exchanges = [] }: { exchanges?: SidebarExchange[] }) {
  const { dictionary, locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const text = dictionary.preview;
  const selectedExchangeId = searchParams.get("exchangeId");
  const activeExchanges = exchanges.filter((exchange) => exchange.isActive);

  const labels: Record<(typeof NAV)[number]["id"], string> = {
    performance: dictionary.nav.performance,
    calendar: locale === "zh" ? "月度复盘" : "Monthly Review",
    analytics: dictionary.nav.analytics,
    trades: locale === "zh" ? "交易记录" : "Trade Records",
    settings: dictionary.nav.settings,
  };

  function exchangeHref(exchangeId: string | null): string {
    const params = new URLSearchParams(searchParams.toString());
    if (exchangeId) params.set("exchangeId", exchangeId);
    else params.delete("exchangeId");
    params.delete("tradeId");
    params.delete("page");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-line-strong bg-canvas">
      <div className="px-5 pb-3 pt-4">
        <div className="truncate text-[15px] font-semibold leading-6 text-ink">{dictionary.common.appName}</div>
        <div className="mt-0.5 text-[12px] leading-5 text-ink-3">
          <span>{text.badge}</span>
          <span className="mx-1.5">·</span>
          <a href={toDashboardHref(pathname, searchParams.toString())} className="v2-link text-ink-3 hover:text-ink">
            {text.backToCurrent}
          </a>
        </div>
      </div>

      <nav className="px-3 pt-1" aria-label={dictionary.common.dashboard}>
        {NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={scopedHref(item.href, searchParams)}
              aria-current={isActive ? "page" : undefined}
              className={`v2-link mb-0.5 flex h-9 items-center gap-3 rounded-md px-3 text-[14px] no-underline transition-colors ${
                isActive ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface hover:text-ink"
              }`}
            >
              <item.Icon className={isActive ? "text-accent" : "text-ink-3"} />
              <span>{labels[item.id]}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-3">
        <div className="px-3 text-[12px] font-medium text-ink-3">{text.dataSource}</div>
        <div className="mt-1.5">
          <Link
            href={exchangeHref(null)}
            aria-current={!selectedExchangeId ? "true" : undefined}
            className={`v2-link flex h-9 items-center justify-between rounded-md px-3 text-[13px] no-underline transition-colors ${
              !selectedExchangeId ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface hover:text-ink"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className={`h-1.5 w-1.5 rounded-full ${!selectedExchangeId ? "bg-accent" : "bg-line-strong"}`} />
              {text.allExchanges}
            </span>
          </Link>

          {activeExchanges.length === 0 ? (
            <div className="px-3 py-2 text-[13px] text-ink-3">{text.noExchange}</div>
          ) : (
            activeExchanges.map((exchange) => {
              const isSelected = exchange.id === selectedExchangeId;
              const name = formatExchangeName(exchange.name);
              return (
                <Link
                  key={exchange.id}
                  href={exchangeHref(exchange.id)}
                  aria-current={isSelected ? "true" : undefined}
                  title={exchange.label ? `${name} · ${exchange.label}` : name}
                  className={`v2-link flex h-9 items-center justify-between gap-2 rounded-md px-3 text-[13px] no-underline transition-colors ${
                    isSelected ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface hover:text-ink"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isSelected ? "bg-accent" : "bg-line-strong"}`} />
                    <span className="truncate">{exchange.label ? `${name} · ${exchange.label}` : name}</span>
                  </span>
                  <span className="v2-num shrink-0 text-[12px] text-ink-3">{exchange._count?.trades ?? 0}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

    </aside>
  );
}
