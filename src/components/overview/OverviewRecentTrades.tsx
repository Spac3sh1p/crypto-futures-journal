"use client";

import { useState } from "react";
import { TradeDetailPanel } from "@/components/dashboard/TradeDetailPanel";
import type { SerializedTrade } from "@/components/dashboard/TradeHistoryTable";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import {
  formatMoney,
  formatSignedPositionNotional,
  formatTradeDateTimeParts,
  formatTradePrice,
} from "@/lib/formatters";

function formatTradeReturn(pnl: number, notional: number): string {
  if (!Number.isFinite(notional) || notional === 0) return "--";
  const value = (pnl / Math.abs(notional)) * 100;
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function getMutedMoneyClass(value: number): string {
  return `whitespace-nowrap font-mono text-sm font-medium tabular-nums opacity-70 lg:text-right ${value >= 0 ? "text-green" : "text-red"}`;
}

function getEmphasisMoneyClass(value: number): string {
  return `whitespace-nowrap font-mono text-[15px] font-bold tabular-nums lg:text-right ${value >= 0 ? "text-green" : "text-red"}`;
}

function getDurationParts(seconds: number, locale: "zh" | "en"): Array<{ value: number; unit: string }> {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const units = locale === "zh"
    ? { hour: "小时", minute: "分", second: "秒" }
    : { hour: "h", minute: "m", second: "s" };

  if (h > 0) {
    return [
      { value: h, unit: units.hour },
      { value: m, unit: units.minute },
      { value: s, unit: units.second },
    ];
  }

  if (m > 0) {
    return [
      { value: m, unit: units.minute },
      { value: s, unit: units.second },
    ];
  }

  return [{ value: s, unit: units.second }];
}

function DurationCell({ seconds, locale }: { seconds: number; locale: "zh" | "en" }) {
  return (
    <div className="whitespace-nowrap text-sm text-text-secondary">
      <span className="inline-flex min-w-[7.5rem] items-baseline justify-start gap-1.5">
        {getDurationParts(seconds, locale).map((part) => (
          <span key={part.unit} className="inline-flex items-baseline gap-0.5">
            <span className="min-w-[2ch] text-right font-mono tabular-nums text-text-secondary">{part.value}</span>
            <span className="font-sans text-[12px] font-medium text-text-muted">{part.unit}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

export function OverviewRecentTrades({ trades }: { trades: SerializedTrade[] }) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.overview;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fundingFeeLabel = locale === "zh" ? "资金费率" : "Funding";

  return (
    <section className="trading-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="terminal-section-title">{text.recentTrades}</h3>
          <p className="mt-1 text-xs font-medium text-text-muted">{text.recentTradesHint}</p>
        </div>
        <a
          href="/dashboard/performance?view=trades"
          className="rounded-lg border border-border bg-bg-tertiary/90 px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-yellow/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
        >
          {text.openTradeHistory}
        </a>
      </div>

      {trades.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm font-medium text-text-muted">{text.empty}</div>
      ) : (
        <div>
          <div className="hidden grid-cols-[0.12fr_1fr_0.52fr_0.76fr_0.95fr_0.76fr_0.95fr_1.02fr_0.78fr_0.72fr_0.85fr_0.64fr] gap-3 border-b border-border bg-bg-tertiary/42 px-5 py-3 text-[11px] font-semibold text-text-muted lg:grid">
            <div />
            <div>{dictionary.tradeHistory.columns.symbolSize}</div>
            <div>{dictionary.common.type}</div>
            <div>{dictionary.tradeHistory.columns.open}</div>
            <div>{dictionary.common.time}</div>
            <div>{dictionary.tradeHistory.columns.close}</div>
            <div>{dictionary.common.time}</div>
            <div>{dictionary.tradeHistory.columns.holdTime}</div>
            <div className="text-right">{fundingFeeLabel}</div>
            <div className="text-right">{dictionary.tradeHistory.columns.fee}</div>
            <div className="text-right">{dictionary.tradeHistory.columns.realisedPnl}</div>
            <div className="text-right">{locale === "zh" ? "盈亏率" : "Return"}</div>
          </div>
          {trades.map((trade) => {
            const isExpanded = expandedId === trade.id;
            const entry = formatTradeDateTimeParts(trade.entryTime, locale);
            const exit = formatTradeDateTimeParts(trade.exitTime, locale);
            const tradeReturn = formatTradeReturn(trade.realizedPnl, trade.entryValue);
            return (
              <div key={trade.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId((current) => current === trade.id ? null : trade.id)}
                  aria-label={template(isExpanded ? dictionary.tradeHistory.collapse : dictionary.tradeHistory.expand, { symbol: trade.symbol })}
                  aria-expanded={isExpanded}
                  className={`grid w-full grid-cols-1 gap-3 border-b border-border-light px-5 py-4 text-left transition-colors hover:bg-bg-hover/52 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow/50 lg:grid-cols-[0.12fr_1fr_0.52fr_0.76fr_0.95fr_0.76fr_0.95fr_1.02fr_0.78fr_0.72fr_0.85fr_0.64fr] lg:items-center ${
                    isExpanded ? "bg-bg-hover/82 shadow-[inset_3px_0_0_var(--yellow)]" : ""
                  }`}
                >
                  <span className={`hidden text-text-muted transition-transform lg:block ${isExpanded ? "rotate-90 text-yellow" : ""}`}>
                    &gt;
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-text-primary">{trade.symbol}</span>
                    </div>
                    <div className={`mt-1 font-mono text-xs tabular-nums ${trade.side === "Long" ? "text-green" : "text-red"}`}>
                      {formatSignedPositionNotional(trade.entryValue, trade.side)}
                    </div>
                  </div>

                  <div>
                    <span className={`whitespace-nowrap rounded px-2 py-1 text-[11px] font-semibold ${trade.side === "Long" ? "bg-green-dim text-green" : "bg-red-dim text-red"}`}>
                      {trade.side === "Long" ? dictionary.common.long : dictionary.common.short}
                    </span>
                  </div>

                  <div className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                    {formatTradePrice(trade.entryPrice)}
                  </div>

                  <div className="grid justify-items-start gap-0.5 font-mono text-sm font-semibold leading-tight tabular-nums" title={entry.full}>
                    <span className="font-sans text-[11px] font-semibold text-text-muted lg:hidden">{dictionary.tradeHistory.columns.open}</span>
                    <span className="text-text-secondary">{entry.date}</span>
                    <span className="text-text-muted">{entry.time}</span>
                  </div>

                  <div className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                    {formatTradePrice(trade.exitPrice)}
                  </div>

                  <div className="grid justify-items-start gap-0.5 font-mono text-sm font-semibold leading-tight tabular-nums" title={exit.full}>
                    <span className="font-sans text-[11px] font-semibold text-text-muted lg:hidden">{dictionary.tradeHistory.columns.close}</span>
                    <span className="text-text-secondary">{exit.date}</span>
                    <span className="text-text-muted">{exit.time}</span>
                  </div>

                  <DurationCell seconds={trade.holdDuration} locale={locale} />

                  <div className={getMutedMoneyClass(trade.fundingFee)}>
                    {formatMoney(trade.fundingFee)}
                  </div>

                  <div className="whitespace-nowrap font-mono text-sm font-medium text-red opacity-70 tabular-nums lg:text-right">
                    {formatMoney(-Math.abs(trade.fee))}
                  </div>

                  <div className={getEmphasisMoneyClass(trade.realizedPnl)}>
                    {formatMoney(trade.realizedPnl)}
                  </div>

                  <div className={`font-mono text-[15px] font-bold tabular-nums lg:text-right ${trade.realizedPnl >= 0 ? "text-green" : "text-red"}`}>
                    {tradeReturn}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-b border-border-light bg-bg-primary">
                    <TradeDetailPanel trade={trade} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
