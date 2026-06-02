import Link from "next/link";
import type {
  MonthlyCalendarDay,
  MonthlyCalendarHighlightTrade,
  MonthlyCalendarSummary,
  MonthlyCalendarTopSymbol,
  MonthlyCalendarTrade,
} from "@/lib/dashboard/calendar-transforms";
import { buildTradeHistoryHref } from "@/lib/dashboard/trade-history-routing";
import type { Locale } from "@/lib/i18n";

const weekdayLabels = {
  zh: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
} as const;

function getText(locale: Locale) {
  if (locale === "zh") {
    return {
      title: "月度复盘",
      subtitle: "按平仓日期查看每日交易结果",
      greenDays: "绿色天数",
      redDays: "红色天数",
      flatDays: "持平天数",
      tradingDays: "交易日",
      trades: "交易笔数",
      bestTrade: "最佳一笔",
      worstTrade: "最差一笔",
      topSymbol: "活跃交易对",
      monthlySummary: "本月摘要",
      calendarTitle: "交易日历",
      week: "周",
      noTrades: "无交易",
      moreTrades: "更多",
      pnlThisMonth: "本月已实现盈亏",
      activity: "交易活跃度",
      reviewNotes: "复盘提示",
      positiveBias: "盈利日多于亏损日，重点复盘是否来自稳定策略，而不是少数大单。",
      negativeBias: "亏损日不少，优先检查连续亏损、过度交易和止损执行。",
      neutralBias: "样本还少，先确保每笔交易都有标签和复盘记录。",
      none: "--",
    };
  }

  return {
    title: "Monthly Review",
    subtitle: "Daily closed-trade results by month",
    greenDays: "Green Days",
    redDays: "Red Days",
    flatDays: "Flat Days",
    tradingDays: "Trading Days",
    trades: "Trades",
    bestTrade: "Best Trade",
    worstTrade: "Worst Trade",
    topSymbol: "Top Symbol",
    monthlySummary: "Month Summary",
    calendarTitle: "Trade Calendar",
    week: "Week",
    noTrades: "No trades",
    moreTrades: "more",
    pnlThisMonth: "Realised PnL",
    activity: "Activity",
    reviewNotes: "Review Prompt",
    positiveBias: "Green days outnumber red days. Check whether the gains came from repeatable setups, not only outliers.",
    negativeBias: "Red days need attention. Review consecutive losses, overtrading, and stop execution first.",
    neutralBias: "Sample size is limited. Start by tagging and reviewing each trade.",
    none: "--",
  };
}

function formatPnl(value: number): string {
  if (value === 0) return "$0";
  const prefix = value > 0 ? "+$" : "-$";
  const abs = Math.abs(value);
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  return `${prefix}${abs.toLocaleString(undefined, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatCompactPnl(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1000) return formatPnl(value);
  const prefix = value > 0 ? "+$" : "-$";
  return `${prefix}${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
}

function formatMonthTitle(month: string, locale: Locale): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (locale === "zh") return `${year}年${monthNumber}月`;
  return new Date(year, monthNumber - 1, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });
}

function dayToneClass(day: MonthlyCalendarDay): string {
  if (!day.isCurrentMonth) return "border-border-light bg-bg-primary/45 text-text-muted opacity-55";
  if (day.tradeCount === 0) return "border-border-light bg-bg-primary/65";
  if (day.pnl > 0) return "border-green/45 bg-green-dim/25 shadow-[inset_3px_0_0_var(--green)]";
  if (day.pnl < 0) return "border-red/45 bg-red-dim/25 shadow-[inset_3px_0_0_var(--red)]";
  return "border-blue/35 bg-blue-dim/20 shadow-[inset_3px_0_0_var(--blue)]";
}

function pnlToneClass(value: number): string {
  if (value > 0) return "text-green";
  if (value < 0) return "text-red";
  return "text-blue";
}

function sideToneClass(side: string): string {
  return side.toLowerCase() === "short"
    ? "bg-red text-white"
    : "bg-green text-[#06131A]";
}

function TradePill({ trade }: { trade: MonthlyCalendarTrade }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] font-bold leading-5" title={`${trade.side} ${trade.symbol} ${formatPnl(trade.pnl)}`}>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.03em] ${sideToneClass(trade.side)}`}>
        {trade.side}
      </span>
      <span className="min-w-0 truncate text-cyan-300">{trade.symbol}</span>
      <span className={`shrink-0 tabular-nums ${pnlToneClass(trade.pnl)}`}>{formatPnl(trade.pnl)}</span>
    </div>
  );
}

function DayCell({ day, text }: { day: MonthlyCalendarDay; text: ReturnType<typeof getText> }) {
  const visibleTrades = day.trades.slice(0, 4);
  const hiddenTradeCount = Math.max(day.trades.length - visibleTrades.length, 0);

  return (
    <div className={`flex min-h-[146px] min-w-[148px] flex-col border p-2.5 ${dayToneClass(day)}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-text-muted">{day.tradeCount > 0 ? `${day.tradeCount}x` : ""}</span>
        <span className={`font-mono text-xs font-bold ${day.isCurrentMonth ? "text-text-secondary" : "text-text-muted"}`}>
          {day.dayOfMonth}
        </span>
      </div>

      <div className="mt-2 flex flex-1 flex-col gap-1">
        {visibleTrades.length > 0 ? (
          visibleTrades.map((trade) => <TradePill key={trade.id} trade={trade} />)
        ) : (
          <div className="grid flex-1 place-items-center font-mono text-xs text-text-muted">-</div>
        )}
        {hiddenTradeCount > 0 && (
          <div className="font-mono text-[11px] font-semibold text-text-muted">
            +{hiddenTradeCount} {text.moreTrades}
          </div>
        )}
      </div>

      <div className={`mt-2 border-t border-border-light pt-2 font-mono text-sm font-bold tabular-nums ${pnlToneClass(day.pnl)}`}>
        {day.tradeCount > 0 ? formatPnl(day.pnl) : text.noTrades}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subValue,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string;
  subValue?: string;
  tone?: "green" | "red" | "blue" | "neutral";
  href?: string;
}) {
  const toneClass = tone === "green" ? "text-green" : tone === "red" ? "text-red" : tone === "blue" ? "text-blue" : "text-text-primary";
  const className = `trading-card px-4 py-4 ${href ? "block transition-colors hover:border-yellow/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60" : ""}`;
  const content = (
    <>
      <div className="terminal-label">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-bold leading-tight tabular-nums ${toneClass}`}>{value}</div>
      {subValue && <div className="mt-2 truncate text-xs font-medium text-text-secondary">{subValue}</div>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} title={`${label}: ${value}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className}>{content}</div>
  );
}

function formatHighlight(trade: MonthlyCalendarHighlightTrade | null, none: string): string {
  if (!trade) return none;
  return trade.symbol;
}

function formatHighlightSub(trade: MonthlyCalendarHighlightTrade | null): string | undefined {
  if (!trade) return undefined;
  return `${trade.side} ${formatPnl(trade.pnl)}`;
}

function formatTopSymbol(symbol: MonthlyCalendarTopSymbol | null, none: string): string {
  return symbol?.symbol ?? none;
}

function formatTopSymbolSub(symbol: MonthlyCalendarTopSymbol | null, locale: Locale): string | undefined {
  if (!symbol) return undefined;
  return locale === "zh"
    ? `${symbol.tradeCount} 笔 / ${formatPnl(symbol.pnl)}`
    : `${symbol.tradeCount} trades / ${formatPnl(symbol.pnl)}`;
}

function ReviewPrompt({ summary, locale }: { summary: MonthlyCalendarSummary; locale: Locale }) {
  const text = getText(locale);
  const prompt = summary.tradingDays === 0
    ? text.neutralBias
    : summary.greenDays > summary.redDays
      ? text.positiveBias
      : summary.redDays > summary.greenDays
        ? text.negativeBias
        : text.neutralBias;

  return (
    <div className="trading-panel p-4">
      <div className="terminal-label">{text.reviewNotes}</div>
      <p className="mt-3 text-sm leading-6 text-text-secondary">{prompt}</p>
    </div>
  );
}

export function MonthlyCalendar({
  summary,
  locale,
  exchangeId,
}: {
  summary: MonthlyCalendarSummary;
  locale: Locale;
  exchangeId?: string;
}) {
  const text = getText(locale);
  const totalTone = summary.totalPnl > 0 ? "text-green" : summary.totalPnl < 0 ? "text-red" : "text-blue";

  return (
    <div className="space-y-4">
      <section className="trading-panel p-4 lg:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-normal text-text-primary">{text.title}</h2>
            <p className="mt-1 text-sm font-medium text-text-muted">{text.subtitle}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="terminal-label">{formatMonthTitle(summary.month, locale)}</div>
            <div className={`mt-1 font-mono text-4xl font-bold leading-none tabular-nums ${totalTone}`}>
              {formatPnl(summary.totalPnl)}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label={text.greenDays} value={String(summary.greenDays)} subValue={text.tradingDays} tone="green" />
        <KpiCard label={text.redDays} value={String(summary.redDays)} subValue={text.tradingDays} tone="red" />
        <KpiCard label={text.flatDays} value={String(summary.flatDays)} subValue={text.tradingDays} tone="blue" />
        <KpiCard label={text.trades} value={String(summary.tradeCount)} subValue={`${summary.tradingDays} ${text.tradingDays}`} />
        <KpiCard
          label={text.bestTrade}
          value={formatHighlight(summary.bestTrade, text.none)}
          subValue={formatHighlightSub(summary.bestTrade)}
          tone="green"
          href={summary.bestTrade ? buildTradeHistoryHref({ tradeId: summary.bestTrade.id, exchangeId }) : undefined}
        />
        <KpiCard
          label={text.worstTrade}
          value={formatHighlight(summary.worstTrade, text.none)}
          subValue={formatHighlightSub(summary.worstTrade)}
          tone="red"
          href={summary.worstTrade ? buildTradeHistoryHref({ tradeId: summary.worstTrade.id, exchangeId }) : undefined}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 min-[1840px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="trading-panel min-w-0 p-4 lg:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="terminal-section-title">{text.calendarTitle}</h3>
              <p className="mt-1 text-xs font-medium text-text-muted">{formatMonthTitle(summary.month, locale)}</p>
            </div>
            <div className={`font-mono text-lg font-bold tabular-nums ${totalTone}`}>{formatPnl(summary.totalPnl)}</div>
          </div>

          <div className="overflow-x-auto">
            <div className="grid min-w-[1120px] grid-cols-[72px_repeat(7,minmax(0,1fr))]">
              <div className="border border-border-light bg-bg-primary/70 p-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                {text.week}
              </div>
              {weekdayLabels[locale].map((weekday) => (
                <div
                  key={weekday}
                  className="border border-border-light bg-bg-primary/70 p-2 text-center text-xs font-bold uppercase tracking-[0.08em] text-cyan-300"
                >
                  {weekday}
                </div>
              ))}

              {summary.weeks.map((week) => (
                <div key={week.label} className="contents">
                  <div className="flex min-h-[146px] flex-col justify-between border border-border-light bg-bg-primary/70 p-2">
                    <span className="font-mono text-xs font-bold text-text-muted">{week.label}</span>
                    <span className={`max-w-full truncate font-mono text-sm font-bold tabular-nums ${pnlToneClass(week.pnl)}`} title={formatPnl(week.pnl)}>
                      {formatCompactPnl(week.pnl)}
                    </span>
                  </div>
                  {week.days.map((day) => (
                    <DayCell key={day.date} day={day} text={text} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="trading-panel p-4">
            <div className="terminal-label">{text.monthlySummary}</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-xs font-medium text-text-muted">{text.pnlThisMonth}</div>
                <div className={`mt-1 font-mono text-2xl font-bold tabular-nums ${totalTone}`}>{formatPnl(summary.totalPnl)}</div>
              </div>
              <div className="border-t border-border-light pt-4">
                <div className="text-xs font-medium text-text-muted">{text.activity}</div>
                <div className="mt-1 font-mono text-sm font-semibold text-text-primary">
                  {summary.tradingDays} {text.tradingDays} / {summary.tradeCount} {text.trades}
                </div>
              </div>
              <div className="border-t border-border-light pt-4">
                <div className="text-xs font-medium text-text-muted">{text.topSymbol}</div>
                <div className="mt-1 font-mono text-lg font-bold text-cyan-300">
                  {formatTopSymbol(summary.topSymbol, text.none)}
                </div>
                {formatTopSymbolSub(summary.topSymbol, locale) && (
                  <div className="mt-1 text-xs font-medium text-text-secondary">
                    {formatTopSymbolSub(summary.topSymbol, locale)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <ReviewPrompt summary={summary} locale={locale} />
        </aside>
      </section>
    </div>
  );
}
