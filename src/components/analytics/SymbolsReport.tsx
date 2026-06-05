"use client";

import { useMemo, useState } from "react";
import type { SymbolReport } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n";

function formatDuration(seconds: number, locale: Locale): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (locale === "zh") return `${h}小时 ${m}分`;
  return `${h}h ${m}m`;
}

const PAGE_SIZE = 10;

export function SymbolsReport({ data }: { data: SymbolReport[] }) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.analytics.symbols;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageRows = useMemo(() => {
    return data.slice(startIndex, startIndex + PAGE_SIZE);
  }, [data, startIndex]);

  return (
    <div className="trading-panel overflow-hidden">
      <div className="px-5 py-4">
        <h3 className="terminal-section-title">{dictionary.analytics.reports.symbolsTitle}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-tertiary/42">
              <th className="px-4 py-2 text-left text-xs text-text-muted">{text.symbol}</th>
              <th className="px-4 py-2 text-center text-xs text-text-muted">{text.tradeCount}</th>
              <th className="px-4 py-2 text-center text-xs text-text-muted">{text.winRate}</th>
              <th className="px-4 py-2 text-center text-xs text-text-muted">{text.longVsShort}</th>
              <th className="px-4 py-2 text-center text-xs text-text-muted">{text.avgDuration}</th>
              <th className="px-4 py-2 text-right text-xs text-text-muted">{text.avgGain}</th>
              <th className="px-4 py-2 text-right text-xs text-text-muted">{text.totalGain}</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.symbol} className="border-b border-border-light transition-colors hover:bg-bg-hover/52">
                <td className="px-4 py-3 font-mono text-text-primary text-xs">{row.symbol}</td>
                <td className="px-4 py-3 text-center font-mono text-text-primary text-xs">{row.tradeCount}</td>
                <td className="px-4 py-3 text-center font-mono text-text-primary text-xs">{row.winRate.toFixed(0)}%</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="flex h-3 w-24 rounded overflow-hidden">
                      <div className="bg-green" style={{ width: `${row.longPercent}%` }} />
                      <div className="bg-red" style={{ width: `${row.shortPercent}%` }} />
                    </div>
                    <span className="text-[9px] text-text-muted">
                      {row.longPercent.toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-red">
                      {row.shortPercent.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-mono font-medium ${
                    row.avgDuration > 14400 ? "bg-green/20 text-green" : row.avgDuration > 3600 ? "bg-yellow/20 text-yellow" : "bg-red/20 text-red"
                  }`}>
                    {formatDuration(row.avgDuration, locale)}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-mono text-xs ${row.avgGain >= 0 ? "text-green" : "text-red"}`}>
                  {row.avgGain >= 0 ? "+" : ""}${row.avgGain.toFixed(2)}
                </td>
                <td className={`px-4 py-3 text-right font-mono text-xs ${row.totalGain >= 0 ? "text-green" : "text-red"}`}>
                  {row.totalGain >= 0 ? "+" : ""}${row.totalGain.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-text-muted">
            {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, data.length)} / {data.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={text.previousAria}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              className="rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {text.previous}
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                key={page}
                aria-label={`${text.pageAria} ${page}`}
                aria-current={safePage === page ? "page" : undefined}
                onClick={() => setCurrentPage(page)}
                className={`rounded px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 ${
                  safePage === page
                    ? "bg-yellow text-bg-primary font-semibold"
                    : "border border-border text-text-secondary hover:border-text-muted hover:text-text-primary"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              aria-label={text.nextAria}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safePage === totalPages}
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
