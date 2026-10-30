"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SerializedTrade } from "@/components/dashboard/TradeHistoryTable";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import { formatDuration, formatMoney, sanitizeCsvField } from "@/lib/formatters";
import {
  buildTradeHistoryHref,
  type TradeHistoryScope,
  getInitialTradeHistoryPage,
  TRADE_HISTORY_PAGE_SIZE,
} from "@/lib/dashboard/trade-history-routing";
import { toPreviewHref } from "@/lib/dashboard/preview-routing";
import { EmptyState, Panel, PanelHeader } from "@/components/v2/ui/Panel";
import { TradeDetailV2 } from "./TradeDetailV2";
import { TradeRowV2, TradeTableHeaderV2 } from "./TradeRowV2";

const PAGE_SIZE = TRADE_HISTORY_PAGE_SIZE;

export function TradeTableV2({
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
    router.push(toPreviewHref(buildTradeHistoryHref(next)), { scroll: false });
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
      document.getElementById(`preview-trade-row-${focusedTradeId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expandedId, focusedTradeId, currentPage]);

  function downloadCsv() {
    const headers = locale === "zh"
      ? ["交易对", "方向", "数量", "开仓价格", "开仓时间", "平仓价格", "平仓时间", "持仓时间", "手续费", "资金费", "已实现盈亏", "标签", "笔记"]
      : ["Symbol", "Side", "Qty", "Entry Price", "Entry Time", "Exit Price", "Exit Time", "Hold Duration", "Fee", "Funding Fee", "Realised PNL", "Tags", "Notes"];
    const rows = trades.map((t) => [
      t.symbol, t.side, t.entryQty, t.entryPrice, t.entryTime, t.exitPrice, t.exitTime,
      formatDuration(t.holdDuration, locale), t.fee.toFixed(2), t.fundingFee.toFixed(2), t.realizedPnl.toFixed(2), t.tags || "", t.notes || "",
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

  const pageNumbers = (() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  })();

  const selectClass = "v2-field min-w-32 appearance-none pr-7 bg-[position:right_8px_center] bg-no-repeat";
  const filterFields = ([["symbol", symbols], ["side", ["Long", "Short"]], ["tag", tags]] as const);

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title={text.title}
        subtitle={text.subtitle}
        actions={
          <button type="button" onClick={downloadCsv} className="v2-button">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1v7M6 8L3.5 5.5M6 8l2.5-2.5M2 10h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {text.exportCsv}
          </button>
        }
      />

      <div className="flex flex-wrap items-end gap-x-3 gap-y-2 border-b border-line px-5 py-3">
        {filterFields.map(([key, options]) => (
          <label key={key} className="grid gap-1 text-[12px] text-ink-3">
            {filters[key]}
            <select aria-label={filters[key]} value={scope[key] ?? ""} onChange={(event) => setFilter(key, event.target.value)} className={selectClass}>
              <option value="">{filters.all}</option>
              {scope[key] && !options.some((option) => option === scope[key]) && <option value={scope[key]}>{scope[key]}</option>}
              {options.map((option) => <option key={option} value={option}>{key === "side" ? option === "Long" ? dictionary.common.long : dictionary.common.short : option}</option>)}
            </select>
          </label>
        ))}
        <label className="grid gap-1 text-[12px] text-ink-3">{filters.exitDate}
          <input type="date" aria-label={filters.exitDate} value={scope.exitDate ?? ""} onChange={(event) => setFilter("exitDate", event.target.value)} className="v2-field v2-num" />
        </label>
        <label className="grid gap-1 text-[12px] text-ink-3">{filters.entrySlot}
          <select aria-label={filters.entrySlot} value={scope.entrySlot ?? ""} onChange={(event) => setFilter("entrySlot", event.target.value)} className={selectClass}>
            <option value="">{filters.all}</option>
            {Array.from({ length: 12 }, (_, i) => i * 2).map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00–{String(hour + 2).padStart(2, "0")}:00</option>)}
          </select>
        </label>
        {scope.entryDay && (
          <button type="button" onClick={() => setFilter("entryDay", "")} className="v2-button">
            {filters.entryDay}: {dictionary.analytics.days[scope.entryDay as keyof typeof dictionary.analytics.days]} ×
          </button>
        )}
        <button type="button" onClick={() => navigate({ range: scope.range, exchangeId: scope.exchangeId })} className="v2-link h-8 text-[12px] text-ink-3 no-underline hover:text-ink">
          {filters.clear}
        </button>
        <p role="status" className="basis-full text-[12px] text-ink-3">
          {template(filters.results, { count: trades.length, pnl: formatMoney(trades.reduce((sum, trade) => sum + trade.realizedPnl, 0)) })}
        </p>
      </div>

      {focusedTradeId && focusedIndex < 0 && <p role="status" className="px-5 py-3 text-[12px] text-accent">{filters.missingTrade}</p>}
      {blocked && dirty && <p role="status" className="px-5 py-3 text-[12px] text-accent">{filters.unsaved}</p>}

      <div className="overflow-x-auto">
        <div className="w-full lg:min-w-[1040px]">
          <TradeTableHeaderV2 />
          {pageTrades.map((trade) => {
            const isExpanded = expandedId === trade.id;
            const detailId = `preview-trade-detail-${trade.id}`;
            return (
              <div key={trade.id}>
                <TradeRowV2
                  rowId={`preview-trade-row-${trade.id}`}
                  trade={trade}
                  expanded={isExpanded}
                  controlsId={detailId}
                  onToggle={() => toggleTrade(trade.id)}
                />
                {isExpanded && (
                  <div id={detailId} className="border-b border-line bg-canvas">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5">
                      <span className="text-[12px] text-ink-3">{template(filters.reviewPosition, { index: expandedIndex + 1, total: trades.length })}</span>
                      <div className="flex gap-2">
                        <button type="button" disabled={expandedIndex <= 0} onClick={() => reviewTrade(expandedIndex - 1)} className="v2-button h-7 text-[12px]">{filters.previousTrade}</button>
                        <button type="button" disabled={expandedIndex >= trades.length - 1} onClick={() => reviewTrade(expandedIndex + 1)} className="v2-button h-7 text-[12px]">{filters.nextTrade}</button>
                      </div>
                    </div>
                    <TradeDetailV2 key={trade.id} trade={trade} onTradeUpdated={updateTrade} onDirtyChange={setDirty} />
                  </div>
                )}
              </div>
            );
          })}
          {pageTrades.length === 0 && <EmptyState>{text.empty}</EmptyState>}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
          <span className="v2-num text-[12px] text-ink-3">
            {startIdx + 1}-{Math.min(startIdx + PAGE_SIZE, trades.length)} {text.paginationOf} {trades.length} {dictionary.performance.metrics.trades}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label={text.previousAria} onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="v2-button h-7 text-[12px]">
              {text.previous}
            </button>
            {pageNumbers.map((page, i) =>
              page === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-[12px] text-ink-3">…</span>
              ) : (
                <button
                  type="button"
                  key={page}
                  aria-label={template(text.goToPage, { page })}
                  aria-current={currentPage === page ? "page" : undefined}
                  onClick={() => setPage(page as number)}
                  className={`v2-button v2-num h-7 min-w-7 justify-center px-2 text-[12px] ${currentPage === page ? "border-line-strong bg-surface-3 text-ink" : "border-transparent"}`}
                >
                  {page}
                </button>
              )
            )}
            <button type="button" aria-label={text.nextAria} onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="v2-button h-7 text-[12px]">
              {text.next}
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
