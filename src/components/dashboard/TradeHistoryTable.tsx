"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AccountingStatus } from "@/lib/dashboard/trade-accounting";
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
  buildTradeHistoryHref,
  type TradeHistoryScope,
  getInitialTradeHistoryPage,
  TRADE_HISTORY_PAGE_SIZE,
} from "@/lib/dashboard/trade-history-routing";

export interface SerializedTrade {
  id: string;
  accountingStatus?: AccountingStatus;
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

function getDurationParts(seconds: number, locale: "zh" | "en"): Array<{ value: number | string; unit: string }> {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const units = locale === "zh"
    ? { hour: "小时", minute: "分" }
    : { hour: "h", minute: "m" };

  if (h > 0) {
    return [
      { value: h, unit: units.hour },
      { value: m, unit: units.minute },
    ];
  }

  if (m > 0) {
    return [{ value: m, unit: units.minute }];
  }

  return [{ value: "<1", unit: units.minute }];
}

function DurationCell({ seconds, locale }: { seconds: number; locale: "zh" | "en" }) {
  return (
    <div className="whitespace-nowrap text-sm text-text-secondary">
      <span className="inline-flex min-w-[7.5rem] items-baseline justify-start gap-1.5 lg:justify-center">
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
  trades: initialTrades,
  focusedTradeId,
  scope = {},
  symbols = [],
  tags = [],
}: {
  trades: SerializedTrade[];
  focusedTradeId?: string;
  scope?: TradeHistoryScope;
  symbols?: string[];
  tags?: string[];
}) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.tradeHistory;
  const fundingFeeLabel = locale === "zh" ? "资金费率" : "Funding";
  const returnLabel = locale === "zh" ? "盈亏率" : "Return";
  const filters = dictionary.tradeFilters;
  const router = useRouter();
  const [updates, setUpdates] = useState<Record<string, Partial<SerializedTrade>>>({});
  const trades = initialTrades.map((trade) => ({ ...trade, ...updates[trade.id] }));
  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const focusedIndex = trades.findIndex((trade) => trade.id === focusedTradeId);
  const [expandedId, setExpandedId] = useState<string | null>(focusedIndex >= 0 ? focusedTradeId! : null);
  const totalPages = Math.max(1, Math.ceil(trades.length / PAGE_SIZE));
  const requestedPage = scope.page && /^[1-9]\d*$/.test(scope.page) ? Number(scope.page) : 1;
  const currentPage = focusedIndex >= 0
    ? getInitialTradeHistoryPage(trades.map((trade) => trade.id), focusedTradeId, PAGE_SIZE)
    : Math.min(requestedPage, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageTrades = trades.slice(startIdx, startIdx + PAGE_SIZE);
  const expandedIndex = trades.findIndex((trade) => trade.id === expandedId);

  function navigate(next: TradeHistoryScope) {
    if (dirty) { setBlocked(true); return; }
    router.push(buildTradeHistoryHref(next), { scroll: false });
  }
  function setPage(page: number) {
    navigate({ ...scope, page: String(page), tradeId: undefined });
  }
  function setFilter(key: keyof TradeHistoryScope, value: string) {
    navigate({ ...scope, [key]: value || undefined, page: undefined, tradeId: undefined });
  }
  function toggleTrade(id: string) {
    if (dirty) { setBlocked(true); return; }
    setExpandedId((current) => current === id ? null : id);
  }
  function reviewTrade(index: number) {
    const trade = trades[index];
    if (dirty) { setBlocked(true); return; }
    if (trade) { setExpandedId(trade.id); navigate({ ...scope, tradeId: trade.id, page: undefined }); }
  }
  const updateTrade = useCallback((id: string, changes: { notes?: string | null; tags?: string | null }) => {
    setUpdates((current) => ({ ...current, [id]: { ...current[id], ...changes } }));
    if (changes.tags !== undefined) router.refresh();
  }, [router]);

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

  function downloadCsv() {
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
  }

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

      <div className="flex flex-wrap items-end gap-3 border-b border-border px-5 py-4">
        {([ ["symbol", symbols], ["side", ["Long", "Short"]], ["tag", tags] ] as const).map(([key, options]) => (
          <label key={key} className="grid gap-1.5 text-xs text-text-muted">
            {filters[key]}
            <select aria-label={filters[key]} value={scope[key] ?? ""} onChange={(event) => setFilter(key, event.target.value)} className="min-w-32 rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-secondary focus:border-yellow focus:outline-none">
              <option value="">{filters.all}</option>
              {scope[key] && !options.some((option) => option === scope[key]) && <option value={scope[key]}>{scope[key]}</option>}
              {options.map((option) => <option key={option} value={option}>{key === "side" ? option === "Long" ? dictionary.common.long : dictionary.common.short : option}</option>)}
            </select>
          </label>
        ))}
        <label className="grid gap-1.5 text-xs text-text-muted">{filters.exitDate}
          <input type="date" aria-label={filters.exitDate} value={scope.exitDate ?? ""} onChange={(event) => setFilter("exitDate", event.target.value)} className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-secondary focus:border-yellow focus:outline-none" />
        </label>
        <label className="grid gap-1.5 text-xs text-text-muted">{filters.entrySlot}
          <select aria-label={filters.entrySlot} value={scope.entrySlot ?? ""} onChange={(event) => setFilter("entrySlot", event.target.value)} className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-text-secondary focus:border-yellow focus:outline-none">
            <option value="">{filters.all}</option>
            {Array.from({ length: 12 }, (_, i) => i * 2).map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00–{String(hour + 2).padStart(2, "0")}:00</option>)}
          </select>
        </label>
        {scope.entryDay && <button type="button" onClick={() => setFilter("entryDay", "")} className="rounded border border-border px-3 py-2 text-xs text-text-secondary">{filters.entryDay}: {dictionary.analytics.days[scope.entryDay as keyof typeof dictionary.analytics.days]} ×</button>}
        <button type="button" onClick={() => navigate({ range: scope.range, exchangeId: scope.exchangeId })} className="rounded-lg px-3 py-2 text-xs text-text-muted hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60">{filters.clear}</button>
        <p role="status" className="basis-full pt-1 text-xs text-text-muted">{template(filters.results, { count: trades.length, pnl: formatMoney(trades.reduce((sum, trade) => sum + trade.realizedPnl, 0)) })}</p>
      </div>
      {focusedTradeId && focusedIndex < 0 && <p role="status" className="px-5 py-3 text-xs text-yellow">{filters.missingTrade}</p>}
      {blocked && dirty && <p role="status" className="px-5 py-3 text-xs text-yellow">{filters.unsaved}</p>}
      <div className="overflow-x-auto">
        <div className="w-full text-sm lg:min-w-[1120px]">
          <div className={`hidden ${TRADE_GRID_COLUMNS} gap-3 border-b border-border bg-bg-tertiary/42 px-5 py-3 text-[11px] font-semibold text-text-muted lg:grid`}>
            <div />
            <div>{text.columns.symbolSize}</div>
            <div className="text-center">{dictionary.common.type}</div>
            <div className="text-center">{text.columns.open}</div>
            <div className="text-center">{dictionary.common.time}</div>
            <div className="text-center">{text.columns.close}</div>
            <div className="text-center">{dictionary.common.time}</div>
            <div className="text-center">{text.columns.holdTime}</div>
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
                      {trade.accountingStatus === "needs-review" && <span title={dictionary.accounting.hint} className="rounded border border-yellow/25 px-1 text-[10px] text-yellow">{dictionary.accounting[trade.accountingStatus]}</span>}
                    </div>
                    <div className={`mt-1 font-mono text-xs tabular-nums ${trade.side === "Long" ? "text-green" : "text-red"}`}>
                      {formatSignedPositionNotional(trade.entryValue, trade.side)}
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className={`whitespace-nowrap rounded px-2 py-1 text-[11px] font-semibold ${trade.side === "Long" ? "bg-green-dim text-green" : "bg-red-dim text-red"}`}>
                      {trade.side === "Long" ? dictionary.common.long : dictionary.common.short}
                    </span>
                  </div>

                  <div className="font-mono text-sm font-semibold text-text-primary tabular-nums lg:text-center">
                    {formatTradePrice(trade.entryPrice)}
                  </div>

                  <div className="grid justify-items-start gap-0.5 font-mono text-sm font-semibold leading-tight tabular-nums lg:justify-items-center lg:text-center" title={entry.full}>
                    <span className="font-sans text-[11px] font-semibold text-text-muted lg:hidden">{text.columns.open}</span>
                    <span className="text-text-secondary">{entry.date}</span>
                    <span className="text-text-muted">{entry.time}</span>
                  </div>

                  <div className="font-mono text-sm font-semibold text-text-primary tabular-nums lg:text-center">
                    {formatTradePrice(trade.exitPrice)}
                  </div>

                  <div className="grid justify-items-start gap-0.5 font-mono text-sm font-semibold leading-tight tabular-nums lg:justify-items-center lg:text-center" title={exit.full}>
                    <span className="font-sans text-[11px] font-semibold text-text-muted lg:hidden">{text.columns.close}</span>
                    <span className="text-text-secondary">{exit.date}</span>
                    <span className="text-text-muted">{exit.time}</span>
                  </div>

                  <div className="flex justify-start lg:justify-center">
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
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
                      <span className="text-xs text-text-muted">{template(filters.reviewPosition, { index: expandedIndex + 1, total: trades.length })}</span>
                      <div className="flex gap-2">
                        <button type="button" disabled={expandedIndex <= 0} onClick={() => reviewTrade(expandedIndex - 1)} className="rounded border border-border px-3 py-1.5 text-xs hover:text-yellow disabled:opacity-30">{filters.previousTrade}</button>
                        <button type="button" disabled={expandedIndex >= trades.length - 1} onClick={() => reviewTrade(expandedIndex + 1)} className="rounded border border-border px-3 py-1.5 text-xs hover:text-yellow disabled:opacity-30">{filters.nextTrade}</button>
                      </div>
                    </div>
                    <TradeDetailPanel key={trade.id} trade={trade} onTradeUpdated={updateTrade} onDirtyChange={setDirty} />
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
              onClick={() => setPage(Math.max(1, currentPage - 1))}
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
                  onClick={() => setPage(page as number)}
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
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
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
