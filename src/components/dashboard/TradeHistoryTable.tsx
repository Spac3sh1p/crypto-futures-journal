"use client";

import React, { useState, useCallback } from "react";
import { TradeDetailPanel } from "./TradeDetailPanel";
import { InfoHint } from "@/components/ui/InfoHint";
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

const PAGE_SIZE = 20;

export function TradeHistoryTable({ trades }: { trades: SerializedTrade[] }) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.tradeHistory;
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(trades.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageTrades = trades.slice(startIdx, startIdx + PAGE_SIZE);

  const toggleTrade = useCallback((id: string) => {
    setExpandedId((current) => current === id ? null : id);
  }, []);

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
        <table className="w-full min-w-[940px] text-sm">
          <caption className="sr-only">{text.caption}</caption>
          <thead>
            <tr className="border-b border-border bg-bg-tertiary/42">
              <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  {text.columns.symbolSize}
                  <InfoHint label={text.sizeHelp} />
                </span>
              </th>
              <th scope="col" className="px-5 py-3 text-center text-[11px] font-semibold text-text-muted">{text.columns.open}</th>
              <th scope="col" className="px-5 py-3 text-center text-[11px] font-semibold text-text-muted">{text.columns.holdTime}</th>
              <th scope="col" className="px-5 py-3 text-center text-[11px] font-semibold text-text-muted">{text.columns.close}</th>
              <th scope="col" className="px-5 py-3 text-right text-[11px] font-semibold text-text-muted">{text.columns.fee}</th>
              <th scope="col" className="px-5 py-3 text-right text-[11px] font-semibold text-text-muted">{text.columns.realisedPnl}</th>
            </tr>
          </thead>
          <tbody>
            {pageTrades.map((trade) => {
              const entry = formatTradeDateTimeParts(trade.entryTime, locale);
              const exit = formatTradeDateTimeParts(trade.exitTime, locale);
              const detailId = `trade-detail-${trade.id}`;

              return (
                <React.Fragment key={trade.id}>
                <tr
                  onClick={() => toggleTrade(trade.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleTrade(trade.id);
                    }
                  }}
                  tabIndex={0}
                  aria-expanded={expandedId === trade.id}
                  aria-controls={detailId}
                  className={`cursor-pointer border-b border-border-light transition-all duration-150 hover:bg-bg-hover/52 focus-visible:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yellow/50 ${
                    expandedId === trade.id ? "bg-bg-hover/82 shadow-[inset_3px_0_0_var(--yellow)]" : ""
                  }`}
                >
                  {/* Symbol/Size */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={template(expandedId === trade.id ? text.collapse : text.expand, { symbol: trade.symbol })}
                        aria-expanded={expandedId === trade.id}
                        aria-controls={detailId}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleTrade(trade.id);
                        }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-bg-tertiary text-xs font-bold text-text-secondary transition-colors hover:border-yellow/40 hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
                      >
                        <span className={`transition-transform ${expandedId === trade.id ? "rotate-90" : ""}`}>
                          &gt;
                        </span>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{trade.symbol}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            trade.side === "Long"
                              ? "bg-green-dim text-green"
                              : "bg-red-dim text-red"
                          }`}>
                            {trade.side === "Long" ? dictionary.common.long : dictionary.common.short}
                          </span>
                        </div>
                        <div className={`font-mono text-xs tabular-nums ${trade.side === "Long" ? "text-green" : "text-red"}`}>
                          {formatSignedPositionNotional(trade.entryValue, trade.side)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Open */}
                  <td className="px-5 py-4 text-center">
                    <div className="font-mono font-semibold text-text-primary text-sm">
                      {formatTradePrice(trade.entryPrice)}
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[11px] font-medium text-text-secondary tabular-nums" title={entry.full}>
                      <span>{entry.date}</span>
                      <span className="text-text-muted/70">-</span>
                      <span>{entry.time}</span>
                    </div>
                  </td>

                  {/* Hold Time */}
                  <td className="px-5 py-4 text-center font-mono text-text-secondary text-sm">
                    {formatDuration(trade.holdDuration, locale)}
                  </td>

                  {/* Close */}
                  <td className="px-5 py-4 text-center">
                    <div className="font-mono font-semibold text-text-primary text-sm">
                      {formatTradePrice(trade.exitPrice)}
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[11px] font-medium text-text-secondary tabular-nums" title={exit.full}>
                      <span>{exit.date}</span>
                      <span className="text-text-muted/70">-</span>
                      <span>{exit.time}</span>
                    </div>
                  </td>

                  {/* Fee */}
                  <td className="px-5 py-4 text-right font-mono text-red text-sm">
                    {formatMoney(-Math.abs(trade.fee))}
                  </td>

                  {/* Realised PNL */}
                  <td className={`px-5 py-4 text-right font-mono font-semibold text-sm ${
                    trade.realizedPnl >= 0 ? "text-green" : "text-red"
                  }`}>
                    {formatMoney(trade.realizedPnl)}
                  </td>
                </tr>
                {expandedId === trade.id && (
                  <tr id={detailId}>
                    <td colSpan={6} className="p-0">
                      <TradeDetailPanel trade={trade} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {pageTrades.length === 0 && (
          <div className="px-5 py-10 text-center text-sm font-medium text-text-muted">
            {text.empty}
          </div>
        )}
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
