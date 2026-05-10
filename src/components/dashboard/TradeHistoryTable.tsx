"use client";

import React, { useState, useCallback } from "react";
import { TradeDetailPanel } from "./TradeDetailPanel";
import { formatDuration, sanitizeCsvField } from "@/lib/formatters";

interface SerializedTrade {
  id: string;
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
}

const PAGE_SIZE = 20;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en", { month: "short" });
  const yr = String(d.getFullYear()).slice(2);
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return `${day}/${mon}/${yr} - ${time}`;
}

export function TradeHistoryTable({ trades }: { trades: SerializedTrade[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(trades.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageTrades = trades.slice(startIdx, startIdx + PAGE_SIZE);

  const downloadCsv = useCallback(() => {
    const headers = ["Symbol", "Side", "Qty", "Entry Price", "Entry Time", "Exit Price", "Exit Time", "Hold Duration", "Fee", "Funding Fee", "Realised PNL", "Tags", "Notes"];
    const rows = trades.map((t) => [
      t.symbol,
      t.side,
      t.entryQty,
      t.entryPrice,
      t.entryTime,
      t.exitPrice,
      t.exitTime,
      formatDuration(t.holdDuration),
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
  }, [trades]);

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
    <div className="bg-bg-secondary rounded-lg border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Trade History
        </h3>
        <button
          onClick={downloadCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border hover:border-text-muted rounded transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-70">
            <path d="M6 1v7M6 8L3.5 5.5M6 8l2.5-2.5M2 10h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-semibold text-text-muted tracking-wider">Symbol/Size</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted tracking-wider">Open</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted tracking-wider">Hold Time</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-text-muted tracking-wider">Close</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-text-muted tracking-wider">Fee</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-text-muted tracking-wider">Realised PNL</th>
            </tr>
          </thead>
          <tbody>
            {pageTrades.map((trade) => (
              <React.Fragment key={trade.id}>
                <tr
                  onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
                  className={`border-b border-border-light hover:bg-bg-hover transition-colors cursor-pointer ${
                    expandedId === trade.id ? "bg-bg-hover" : ""
                  }`}
                >
                  {/* Symbol/Size */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-text-primary text-sm">{trade.symbol}</div>
                    <div className={`text-xs font-mono ${trade.side === "Long" ? "text-green" : "text-red"}`}>
                      {trade.side === "Long" ? "+" : "-"}{trade.entryQty.toLocaleString()}
                    </div>
                  </td>

                  {/* Open */}
                  <td className="px-5 py-4 text-center">
                    <div className="font-mono font-semibold text-text-primary text-sm">
                      ${trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}@
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {formatDateTime(trade.entryTime)}
                    </div>
                  </td>

                  {/* Hold Time */}
                  <td className="px-5 py-4 text-center font-mono text-text-secondary text-sm">
                    {formatDuration(trade.holdDuration)}
                  </td>

                  {/* Close */}
                  <td className="px-5 py-4 text-center">
                    <div className="font-mono font-semibold text-text-primary text-sm">
                      ${trade.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}@
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {formatDateTime(trade.exitTime)}
                    </div>
                  </td>

                  {/* Fee */}
                  <td className="px-5 py-4 text-right font-mono text-red text-sm">
                    -${trade.fee.toFixed(2)}
                  </td>

                  {/* Realised PNL */}
                  <td className={`px-5 py-4 text-right font-mono font-semibold text-sm ${
                    trade.realizedPnl >= 0 ? "text-green" : "text-red"
                  }`}>
                    {trade.realizedPnl >= 0 ? "+" : ""}${trade.realizedPnl.toFixed(2)}
                  </td>
                </tr>
                {expandedId === trade.id && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <TradeDetailPanel trade={trade} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <span className="text-xs text-text-muted">
            {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, trades.length)} of {trades.length} trades
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs rounded border border-border text-text-secondary hover:text-text-primary hover:border-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {getPageNumbers().map((page, i) =>
              page === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-text-muted">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs rounded border border-border text-text-secondary hover:text-text-primary hover:border-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
