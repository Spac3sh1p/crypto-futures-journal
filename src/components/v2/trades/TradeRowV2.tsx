"use client";

import type { ReactNode } from "react";
import type { SerializedTrade } from "@/components/dashboard/TradeHistoryTable";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import {
  formatMoney,
  formatSignedPositionNotional,
  formatTradeDateTimeParts,
  formatTradePrice,
} from "@/lib/formatters";

export const TRADE_GRID_V2 =
  "lg:grid-cols-[minmax(136px,1.15fr)_48px_minmax(86px,0.8fr)_minmax(90px,0.85fr)_minmax(86px,0.8fr)_minmax(90px,0.85fr)_minmax(96px,0.9fr)_minmax(76px,0.7fr)_minmax(76px,0.7fr)_minmax(104px,0.95fr)_minmax(68px,0.6fr)]";

export function formatTradeReturn(pnl: number, notional: number): string {
  if (!Number.isFinite(notional) || notional === 0) return "--";
  const value = (pnl / Math.abs(notional)) * 100;
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function durationParts(seconds: number, locale: "zh" | "en"): Array<{ value: number | string; unit: string }> {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const units = locale === "zh" ? { hour: "小时", minute: "分" } : { hour: "h", minute: "m" };
  if (h > 0) return [{ value: h, unit: units.hour }, { value: m, unit: units.minute }];
  if (m > 0) return [{ value: m, unit: units.minute }];
  return [{ value: "<1", unit: units.minute }];
}

function Cell({ children, align = "left", className = "" }: { children: ReactNode; align?: "left" | "center" | "right"; className?: string }) {
  const alignClass = align === "right" ? "lg:text-right" : align === "center" ? "lg:text-center" : "";
  return <div className={`min-w-0 ${alignClass} ${className}`}>{children}</div>;
}

export function TradeTableHeaderV2() {
  const { dictionary, locale } = useI18n();
  const columns = dictionary.tradeHistory.columns;
  const fundingLabel = locale === "zh" ? "资金费" : "Funding";
  const returnLabel = locale === "zh" ? "盈亏率" : "Return";
  return (
    <div className={`hidden ${TRADE_GRID_V2} gap-2.5 border-b border-line px-5 py-2.5 text-[12px] text-ink-3 lg:grid`}>
      <div>{columns.symbolSize}</div>
      <div className="text-center">{dictionary.common.type}</div>
      <div className="text-center">{columns.open}</div>
      <div className="text-center">{dictionary.common.time}</div>
      <div className="text-center">{columns.close}</div>
      <div className="text-center">{dictionary.common.time}</div>
      <div className="text-center">{columns.holdTime}</div>
      <div className="text-right">{fundingLabel}</div>
      <div className="text-right">{columns.fee}</div>
      <div className="text-right">{columns.realisedPnl}</div>
      <div className="text-right">{returnLabel}</div>
    </div>
  );
}

export function TradeRowV2({
  trade,
  expanded,
  onToggle,
  controlsId,
  rowId,
}: {
  trade: SerializedTrade;
  expanded: boolean;
  onToggle: () => void;
  controlsId?: string;
  rowId?: string;
}) {
  const { dictionary, locale } = useI18n();
  const entry = formatTradeDateTimeParts(trade.entryTime, locale);
  const exit = formatTradeDateTimeParts(trade.exitTime, locale);
  const isLong = trade.side === "Long";
  const isWin = trade.realizedPnl >= 0;
  const pnlTone = isWin ? "text-profit" : "text-loss";

  return (
    <button
      id={rowId}
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controlsId}
      aria-label={template(expanded ? dictionary.tradeHistory.collapse : dictionary.tradeHistory.expand, { symbol: trade.symbol })}
      className={`v2-row grid w-full grid-cols-1 gap-2.5 px-5 py-3 text-left ${TRADE_GRID_V2} lg:items-center`}
    >
      <Cell>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-ink">{trade.symbol}</span>
          {trade.accountingStatus === "needs-review" && (
            <span title={dictionary.accounting.hint} className="rounded-sm border border-line-strong px-1 text-[11px] text-ink-3">
              {dictionary.accounting[trade.accountingStatus]}
            </span>
          )}
        </div>
        <div className={`v2-num mt-0.5 text-[12px] ${isLong ? "text-profit" : "text-loss"}`}>
          {formatSignedPositionNotional(trade.entryValue, trade.side)}
        </div>
      </Cell>

      <Cell align="center">
        <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1.5 text-[12px] font-medium ${isLong ? "bg-profit/12 text-profit" : "bg-loss/12 text-loss"}`}>
          {isLong ? dictionary.common.long : dictionary.common.short}
        </span>
      </Cell>

      <Cell align="center" className="v2-num text-[13px] text-ink">{formatTradePrice(trade.entryPrice)}</Cell>

      <Cell align="center" className="v2-num text-[12px] leading-[18px]">
        <span className="mr-2 text-ink-3 lg:hidden">{dictionary.tradeHistory.columns.open}</span>
        <span className="text-ink-2">{entry.date}</span>
        <span className="block text-ink-3">{entry.time}</span>
      </Cell>

      <Cell align="center" className="v2-num text-[13px] text-ink">{formatTradePrice(trade.exitPrice)}</Cell>

      <Cell align="center" className="v2-num text-[12px] leading-[18px]">
        <span className="mr-2 text-ink-3 lg:hidden">{dictionary.tradeHistory.columns.close}</span>
        <span className="text-ink-2">{exit.date}</span>
        <span className="block text-ink-3">{exit.time}</span>
      </Cell>

      <Cell align="center" className="text-[13px] text-ink-2">
        <span className="inline-flex items-baseline gap-1.5">
          {durationParts(trade.holdDuration, locale).map((part) => (
            <span key={part.unit} className="inline-flex items-baseline gap-0.5">
              <span className="v2-num">{part.value}</span>
              <span className="text-[12px] text-ink-3">{part.unit}</span>
            </span>
          ))}
        </span>
      </Cell>

      <Cell align="right" className={`v2-num text-[13px] ${trade.fundingFee >= 0 ? "text-profit/70" : "text-loss/70"}`}>
        {formatMoney(trade.fundingFee)}
      </Cell>

      <Cell align="right" className="v2-num text-[13px] text-loss/70">{formatMoney(-Math.abs(trade.fee))}</Cell>

      <Cell align="right" className={`v2-num text-[14px] font-semibold ${pnlTone}`}>{formatMoney(trade.realizedPnl)}</Cell>

      <Cell align="right" className={`v2-num text-[14px] font-semibold ${pnlTone}`}>{formatTradeReturn(trade.realizedPnl, trade.entryValue)}</Cell>
    </button>
  );
}
