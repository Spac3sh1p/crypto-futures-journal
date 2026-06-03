"use client";

import { useState, useCallback, useEffect } from "react";
import { TradeDetailPanel } from "./TradeDetailPanel";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import {
  formatDuration,
  formatMoney,
  formatSignedPositionNotional,
  formatTradeDateTimeParts,
  formatTradePrice,
  sanitizeCsvField,
} from "@/lib/formatters";
import {
  getInitialTradeHistoryPage,
  TRADE_HISTORY_PAGE_SIZE,
} from "@/lib/dashboard/trade-history-routing";

export interface SerializedTrade {
  id: string;
  exchangeName: string;
  symbol: string;
  side: string;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnl: number;
  fee: number;
  fundingFee: number;
  holdDuration: number;
  entryTime: string;
  exitTime: string;
  tags: string | null;
  notes: string | null;
  entryQty: number;
  entryValue: number;
}

const PAGE_SIZE = TRADE_HISTORY_PAGE_SIZE;
const TRADE_GRID_COLUMNS = "lg:grid-cols-[0.12fr_1fr_0.52fr_0.76fr_0.95fr_0.76fr_0.95fr_1.02fr_0.78fr_0.72fr_0.85fr_0.64fr]";

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

export function TradeHistoryTable({
  trades,
  focusedTradeId,
}: {
  trades: SerializedTrade[];
  focusedTradeId?: string;
}) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.tradeHistory;
  const fundingFeeLabel = locale === "zh" ? "资金费率" : "Funding";
  const returnLabel = locale === "zh" ? "盈亏率" : "Return";
  const [currentPage, setCurrentPage] = useState(() =>
    getInitialTradeHistoryPage(trades.map((trade) => trade.id), focusedTradeId, PAGE_SIZE)
  );
  const [expandedId, setExpandedId] = useState<string | null>(() =>
    focusedTradeId && trades.some((trade) => trade.id === focusedTradeId) ? focusedTradeId : null
  );

  const totalPages = Math.ceil(trades.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageTrades = trades.slice(startIdx, startIdx + PAGE_SIZE);

  const toggleTrade = useCallback((id: string) => {
    setExpandedId((current) => current === id ? null : id);
  }, []);

  useEffect(() => {
    if (!focusedTradeId || expandedId !== focusedTradeId) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`trade-row-${focusedTradeId}`)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [expandedId, focusedTradeId, currentPage]);

  const downloadCsv = useCallback(() => {
    const headers = locale === "zh"
      ? ["交易对", "方向", "数量", "开仓价格", "开仓时间", "平仓价格", "平仓时间", "持仓时间", "手续费", "资金费", "已实现盈亏", "标签", "笔记"]
      : ["Symbol", "Side", "Qty", "Entry Price", "Entry Time", "Exit Price", "Exit Time", "Hold Duration", "Fee", "Funding Fee", "Realised PNL", "Tags", "Notes"];
    const rows = trades.map((t) => [
      t.symbol,
      t.side,
      t.entryQty,
      t.entryPrice,
      t.entryTime,
      t.exitPrice,
      t.exitTime,
      formatDuration(t.holdDuration, locale),
      t.fee.toFixed(2),
      t.fundingFee.toFixed(2),
      t.realizedPnl.toFixed(2),
      t.tags || "",
      t.notes || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${sanitizeCsvField(String(c)).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [locale, trades]);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="trading-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="terminal-section-title">
            {text.title}
          </h3>
          <p className="mt-1 text-xs font-medium text-text-muted">
            {text.subtitle}
          </p>
        </div>
        <button
          onClick={downloadCsv}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-tertiary/90 px-3 py-2 text-xs font-semibold text-text-secondary transition-all duration-200 hover:border-yellow/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-70">
            <path d="M6 1v7M6 8L3.5 5.5M6 8l2.5-2.5M2 10h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {text.exportCsv}
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="w-full text-sm">
          <div className={`hidden ${TRADE_GRID_COLUMNS} gap-3 border-b border-border bg-bg-tertiary/42 px-5 py-3 text-[11px] font-semibold text-text-muted lg:grid`}>
            <div />
            <div>{text.columns.symbolSize}</div>
            <div>{dictionary.common.type}</div>
            <div>{text.columns.open}</div>
            <div>{dictionary.common.time}</div>
            <div>{text.columns.close}</div>
            <div>{dictionary.common.time}</div>
            <div>{text.columns.holdTime}</div>
            <div className="text-right">{fundingFeeLabel}</div>
            <div className="text-right">{text.columns.fee}</div>
            <div className="text-right">{text.columns.realisedPnl}</div>
            <div className="text-right">{returnLabel}</div>
          </div>
          {pageTrades.map((trade) => {
            const isExpanded = expandedId === trade.id;
            const entry = formatTradeDateTimeParts(trade.entryTime, locale);
            const exit = formatTradeDateTimeParts(trade.exitTime, locale);
            const detailId = `trade-detail-${trade.id}`;
            const tradeReturn = formatTradeReturn(trade.realizedPnl, trade.entryValue);

            return (
              <div key={trade.id}>
                <button
                  id={`trade-row-${trade.id}`}
                  type="button"
                  onClick={() => toggleTrade(trade.id)}
                  aria-label={template(isExpanded ? text.collapse : text.expand, { symbol: trade.symbol })}
                  aria-expanded={isExpanded}
                  aria-controls={detailId}
                  className={`grid w-full grid-cols-1 gap-3 border-b border-border-light px-5 py-4 text-left transition-colors hover:bg-bg-hover/52 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow/50 ${TRADE_GRID_COLUMNS} lg:items-center ${
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
                    <span className="font-sans text-[11px] font-semibold text-text-muted lg:hidden">{text.columns.open}</span>
                    <span className="text-text-secondary">{entry.date}</span>
                    <span className="text-text-muted">{entry.time}</span>
                  </div>

                  <div className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                    {formatTradePrice(trade.exitPrice)}
                  </div>

                  <div className="grid justify-items-start gap-0.5 font-mono text-sm font-semibold leading-tight tabular-nums" title={exit.full}>
                    <span className="font-sans text-[11px] font-semibold text-text-muted lg:hidden">{text.columns.close}</span>
                    <span className="text-text-secondary">{exit.date}</span>
                    <span className="text-text-muted">{exit.time}</span>
                  </div>

                  <div>
                    <DurationCell seconds={trade.holdDuration} locale={locale} />
                  </div>

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
                  <div id={detailId} className="border-b border-border-light bg-bg-primary">
                    <TradeDetailPanel trade={trade} />
                  </div>
                )}
              </div>
            );
          })}
        {pageTrades.length === 0 && (
          <div className="px-5 py-10 text-center text-sm font-medium text-text-muted">
            {text.empty}
          </div>
        )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-text-muted">
            {startIdx + 1}-{Math.min(startIdx + PAGE_SIZE, trades.length)} {text.paginationOf} {trades.length} {dictionary.performance.metrics.trades}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={text.previousAria}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {text.previous}
            </button>
            {getPageNumbers().map((page, i) =>
              page === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-text-muted">...</span>
              ) : (
                <button
                  type="button"
                  aria-label={template(text.goToPage, { page })}
                  aria-current={currentPage === page ? "page" : undefined}
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`rounded px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 ${
                    currentPage === page
                      ? "bg-yellow text-bg-primary font-semibold"
                      : "border border-border text-text-secondary hover:text-text-primary hover:border-text-muted"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              type="button"
              aria-label={text.nextAria}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {text.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
