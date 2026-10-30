import Link from "next/link";
import type {
  MonthlyCalendarDay,
  MonthlyCalendarHighlightTrade,
  MonthlyCalendarSummary,
  MonthlyCalendarTrade,
} from "@/lib/dashboard/calendar-transforms";
import { buildTradeHistoryHref } from "@/lib/dashboard/trade-history-routing";
import type { Locale } from "@/lib/i18n";
import { Panel, PanelHeader } from "@/components/ui/Panel";

const weekdayLabels = {
  zh: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
} as const;

function getText(locale: Locale) {
  if (locale === "zh") {
    return {
      greenDays: "绿色天数", redDays: "红色天数", flatDays: "持平天数", tradingDays: "交易日", trades: "交易笔数",
      bestTrade: "最佳一笔", worstTrade: "最差一笔", topSymbol: "活跃交易对", calendarTitle: "交易日历", week: "周",
      moreTrades: "更多", pnlThisMonth: "本月已实现盈亏", long: "多", short: "空", none: "--",
      positiveBias: "盈利日多于亏损日，重点复盘是否来自稳定策略，而不是少数大单。",
      negativeBias: "亏损日不少，优先检查连续亏损、过度交易和止损执行。",
      neutralBias: "样本还少，先确保每笔交易都有标签和复盘记录。",
      tradesUnit: "笔",
    };
  }
  return {
    greenDays: "Green days", redDays: "Red days", flatDays: "Flat days", tradingDays: "trading days", trades: "Trades",
    bestTrade: "Best trade", worstTrade: "Worst trade", topSymbol: "Top symbol", calendarTitle: "Trade calendar", week: "Week",
    moreTrades: "more", pnlThisMonth: "Realised PnL", long: "L", short: "S", none: "--",
    positiveBias: "Green days outnumber red days. Check whether the gains came from repeatable setups, not only outliers.",
    negativeBias: "Red days need attention. Review consecutive losses, overtrading, and stop execution first.",
    neutralBias: "Sample size is limited. Start by tagging and reviewing each trade.",
    tradesUnit: "trades",
  };
}

function formatPnl(value: number): string {
  if (value === 0) return "$0";
  const prefix = value > 0 ? "+$" : "-$";
  const abs = Math.abs(value);
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  return `${prefix}${abs.toLocaleString(undefined, { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function formatCompactPnl(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) return `${value > 0 ? "+$" : "-$"}${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  if (abs >= 100) return `${value > 0 ? "+$" : "-$"}${Math.round(abs)}`;
  return formatPnl(value);
}

function formatMonthTitle(month: string, locale: Locale): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (locale === "zh") return `${year}年${monthNumber}月`;
  return new Date(year, monthNumber - 1, 1).toLocaleString("en", { month: "long", year: "numeric" });
}

function pnlTone(value: number): string {
  if (value > 0) return "text-profit";
  if (value < 0) return "text-loss";
  return "text-ink-2";
}

function dayTone(day: MonthlyCalendarDay): string {
  if (!day.isCurrentMonth) return "bg-canvas text-ink-3";
  if (day.tradeCount === 0) return "bg-surface";
  if (day.pnl > 0) return "ui-tint-profit";
  if (day.pnl < 0) return "ui-tint-loss";
  return "bg-surface-2";
}

function TradePill({ trade, exchangeId, date, text }: { trade: MonthlyCalendarTrade; exchangeId?: string; date: string; text: ReturnType<typeof getText> }) {
  const isLong = trade.side.toLowerCase() !== "short";
  return (
    <Link
      href={buildTradeHistoryHref({ tradeId: trade.id, exchangeId, exitDate: date })}
      className="ui-link flex min-w-0 items-center gap-1.5 rounded-sm text-[12px] leading-5 no-underline hover:bg-surface-2"
      title={`${trade.side} ${trade.symbol} ${formatPnl(trade.pnl)}`}
    >
      <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-medium ${isLong ? "bg-profit/14 text-profit" : "bg-loss/14 text-loss"}`}>
        {isLong ? text.long : text.short}
      </span>
      <span className="min-w-0 truncate text-ink-2">{trade.symbol.replace(/USDT$/, "")}</span>
      <span className={`ui-num ml-auto shrink-0 ${pnlTone(trade.pnl)}`}>{formatCompactPnl(trade.pnl)}</span>
    </Link>
  );
}

function DayCell({ day, text, exchangeId }: { day: MonthlyCalendarDay; text: ReturnType<typeof getText>; exchangeId?: string }) {
  const href = buildTradeHistoryHref({ exchangeId, exitDate: day.date });
  const visibleTrades = day.trades.slice(0, 4);
  const hidden = Math.max(day.trades.length - visibleTrades.length, 0);

  return (
    <div className={`flex min-h-[128px] min-w-[132px] flex-col p-2 ${dayTone(day)} ${day.isCurrentMonth ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between">
        <span className="ui-num text-[11px] text-ink-3">{day.tradeCount > 0 ? `${day.tradeCount}x` : ""}</span>
        <Link href={href} aria-label={`${day.date} · ${text.trades}`} className={`ui-link ui-num rounded-sm px-1 text-[12px] no-underline ${day.isCurrentMonth ? "text-ink-2 hover:text-ink" : "text-ink-3"}`}>
          {day.dayOfMonth}
        </Link>
      </div>
      <div className="mt-1.5 flex flex-1 flex-col gap-0.5">
        {visibleTrades.map((trade) => <TradePill key={trade.id} trade={trade} exchangeId={exchangeId} date={day.date} text={text} />)}
        {hidden > 0 && (
          <Link href={href} className="ui-link ui-num text-[11px] text-ink-3 no-underline hover:text-ink-2">+{hidden} {text.moreTrades}</Link>
        )}
      </div>
      {day.tradeCount > 0 && (
        <div className={`ui-num mt-1.5 border-t border-line pt-1.5 text-[13px] font-semibold ${pnlTone(day.pnl)}`}>{formatPnl(day.pnl)}</div>
      )}
    </div>
  );
}

function highlightHref(trade: MonthlyCalendarHighlightTrade | null, exchangeId?: string): string | undefined {
  return trade ? buildTradeHistoryHref({ tradeId: trade.id, exchangeId }) : undefined;
}

function Stat({ label, value, sub, tone, href }: { label: string; value: string; sub?: string; tone?: string; href?: string }) {
  const body = (
    <>
      <div className="text-[12px] text-ink-3">{label}</div>
      <div className={`ui-figure mt-1 truncate text-[20px] leading-7 ${tone ?? "text-ink"}`}>{value}</div>
      {sub && <div className="ui-num mt-0.5 truncate text-[12px] text-ink-3">{sub}</div>}
    </>
  );
  const className = "min-w-0 bg-surface px-5 py-4";
  if (href) {
    return <Link href={href} className={`ui-link block ${className} no-underline hover:bg-surface-2`} title={`${label}: ${value}`}>{body}</Link>;
  }
  return <div className={className}>{body}</div>;
}

export function MonthlyCalendar({ summary, locale, exchangeId }: { summary: MonthlyCalendarSummary; locale: Locale; exchangeId?: string }) {
  const text = getText(locale);
  const prompt = summary.tradingDays === 0
    ? text.neutralBias
    : summary.greenDays > summary.redDays
      ? text.positiveBias
      : summary.redDays > summary.greenDays
        ? text.negativeBias
        : text.neutralBias;
  const sideWord = (side: string) => side.toLowerCase() === "short" ? text.short : text.long;

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-5 pb-4">
          <div>
            <div className="text-[13px] text-ink-3">{formatMonthTitle(summary.month, locale)} · {text.pnlThisMonth}</div>
            <div className={`ui-figure mt-1 text-[36px] leading-none ${pnlTone(summary.totalPnl)}`}>{formatPnl(summary.totalPnl)}</div>
          </div>
          <div className="ui-num text-[13px] text-ink-2">
            {summary.tradingDays} {text.tradingDays} / {summary.tradeCount} {text.tradesUnit}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line md:grid-cols-4 2xl:grid-cols-7">
          <Stat label={text.greenDays} value={String(summary.greenDays)} tone="text-profit" />
          <Stat label={text.redDays} value={String(summary.redDays)} tone="text-loss" />
          <Stat label={text.flatDays} value={String(summary.flatDays)} />
          <Stat label={text.trades} value={String(summary.tradeCount)} sub={`${summary.tradingDays} ${text.tradingDays}`} />
          <Stat
            label={text.bestTrade}
            value={summary.bestTrade?.symbol ?? text.none}
            sub={summary.bestTrade ? `${sideWord(summary.bestTrade.side)} ${formatPnl(summary.bestTrade.pnl)}` : undefined}
            tone="text-profit"
            href={highlightHref(summary.bestTrade, exchangeId)}
          />
          <Stat
            label={text.worstTrade}
            value={summary.worstTrade?.symbol ?? text.none}
            sub={summary.worstTrade ? `${sideWord(summary.worstTrade.side)} ${formatPnl(summary.worstTrade.pnl)}` : undefined}
            tone="text-loss"
            href={highlightHref(summary.worstTrade, exchangeId)}
          />
          <Stat
            label={text.topSymbol}
            value={summary.topSymbol?.symbol ?? text.none}
            sub={summary.topSymbol ? `${summary.topSymbol.tradeCount} ${text.tradesUnit} / ${formatPnl(summary.topSymbol.pnl)}` : undefined}
          />
          {/* 7 个统计格在 2 列或 4 列布局下会空出最后一格，用面板色补齐 */}
          <div aria-hidden="true" className="bg-surface 2xl:hidden" />
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader title={text.calendarTitle} subtitle={formatMonthTitle(summary.month, locale)} />
        <div className="overflow-x-auto">
          <div className="grid min-w-[1000px] grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-px bg-line">
            <div className="bg-surface px-2 py-2 text-center text-[12px] text-ink-3">{text.week}</div>
            {weekdayLabels[locale].map((weekday) => (
              <div key={weekday} className="bg-surface px-2 py-2 text-center text-[12px] text-ink-3">{weekday}</div>
            ))}
            {summary.weeks.map((week) => (
              <div key={week.label} className="contents">
                <div className="flex min-h-[128px] flex-col justify-between bg-surface p-2">
                  <span className="ui-num text-[11px] text-ink-3">{week.label}</span>
                  <span className={`ui-num truncate text-[12px] font-medium ${pnlTone(week.pnl)}`} title={formatPnl(week.pnl)}>{formatCompactPnl(week.pnl)}</span>
                </div>
                {week.days.map((day) => <DayCell key={day.date} day={day} text={text} exchangeId={exchangeId} />)}
              </div>
            ))}
          </div>
        </div>
        <p className="border-t border-line px-5 py-3 text-[12px] leading-5 text-ink-3">{prompt}</p>
      </Panel>
    </div>
  );
}
