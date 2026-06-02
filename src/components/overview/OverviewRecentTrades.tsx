"use client";

import { useState } from "react";
import { TradeDetailPanel } from "@/components/dashboard/TradeDetailPanel";
import type { SerializedTrade } from "@/components/dashboard/TradeHistoryTable";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import {
  formatDuration,
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

export function OverviewRecentTrades({ trades }: { trades: SerializedTrade[] }) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.overview;
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          <div className="hidden grid-cols-[0.12fr_1.05fr_0.45fr_0.78fr_1fr_0.78fr_1fr_1.05fr_0.75fr_0.85fr_0.7fr] gap-3 border-b border-border bg-bg-tertiary/42 px-5 py-3 text-[11px] font-semibold text-text-muted lg:grid">
            <div />
            <div>{dictionary.tradeHistory.columns.symbolSize}</div>
            <div>{dictionary.common.type}</div>
            <div>{dictionary.tradeHistory.columns.open}</div>
            <div>{dictionary.common.time}</div>
            <div>{dictionary.tradeHistory.columns.close}</div>
            <div>{dictionary.common.time}</div>
            <div>{dictionary.tradeHistory.columns.holdTime}</div>
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
                  className={`grid w-full grid-cols-1 gap-3 border-b border-border-light px-5 py-4 text-left transition-colors hover:bg-bg-hover/52 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow/50 lg:grid-cols-[0.12fr_1.05fr_0.45fr_0.78fr_1fr_0.78fr_1fr_1.05fr_0.75fr_0.85fr_0.7fr] lg:items-center ${
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
                    <span className={`rounded px-2 py-1 text-[11px] font-semibold ${trade.side === "Long" ? "bg-green-dim text-green" : "bg-red-dim text-red"}`}>
                      {trade.side === "Long" ? dictionary.common.long : dictionary.common.short}
                    </span>
                  </div>

                  <div className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                    {formatTradePrice(trade.entryPrice)}
                  </div>

                  <div className="whitespace-nowrap font-mono text-sm font-semibold text-text-primary tabular-nums">
                    <span className="lg:hidden">{dictionary.tradeHistory.columns.open} </span>
                    <span className="text-text-secondary">{entry.date}</span>
                    <span className="mx-1.5 text-text-muted">-</span>
                    <span>{entry.time}</span>
                  </div>

                  <div className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                    {formatTradePrice(trade.exitPrice)}
                  </div>

                  <div className="whitespace-nowrap font-mono text-sm font-semibold text-text-primary tabular-nums">
                    <span className="lg:hidden">{dictionary.tradeHistory.columns.close} </span>
                    <span className="text-text-secondary">{exit.date}</span>
                    <span className="mx-1.5 text-text-muted">-</span>
                    <span>{exit.time}</span>
                  </div>

                  <div className="whitespace-nowrap font-mono text-sm text-text-secondary">{formatDuration(trade.holdDuration, locale)}</div>

                  <div className="whitespace-nowrap font-mono text-sm text-red tabular-nums lg:text-right">
                    {formatMoney(-Math.abs(trade.fee))}
                  </div>

                  <div className={`whitespace-nowrap font-mono text-sm font-semibold tabular-nums lg:text-right ${trade.realizedPnl >= 0 ? "text-green" : "text-red"}`}>
                    {formatMoney(trade.realizedPnl)}
                  </div>

                  <div className={`font-mono text-sm font-semibold tabular-nums lg:text-right ${trade.realizedPnl >= 0 ? "text-green" : "text-red"}`}>
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
