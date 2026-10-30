"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { buildTradeHistoryHref, type TradeHistoryScope } from "@/lib/dashboard/trade-history-routing";
import type { SymbolReport } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { formatMoney } from "@/lib/formatters";
import type { Locale } from "@/lib/i18n";
import { EmptyState, Panel, PanelHeader } from "@/components/ui/Panel";
import { SplitBar } from "@/components/ui/Bars";

function formatHoldDuration(seconds: number, locale: Locale): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (locale === "zh") return `${h}小时 ${m}分`;
  return `${h}h ${m}m`;
}

const PAGE_SIZE = 10;

export function SymbolsReport({ data, scope }: { data: SymbolReport[]; scope?: TradeHistoryScope }) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.analytics.symbols;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageRows = useMemo(() => data.slice(startIndex, startIndex + PAGE_SIZE), [data, startIndex]);
  const th = "px-3 py-2 text-[12px] font-normal text-ink-3";
  const td = "ui-num px-3 py-2 text-[13px]";

  return (
    <Panel className="overflow-hidden">
      <PanelHeader size="sm" title={dictionary.analytics.reports.symbolsTitle} />
      {data.length === 0 && <EmptyState>{dictionary.overview.symbolTop10.empty}</EmptyState>}
      {data.length > 0 && <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr>
              <th className={`${th} pl-4 text-left`}>{text.symbol}</th>
              <th className={`${th} text-right`}>{text.tradeCount}</th>
              <th className={`${th} text-right`}>{text.winRate}</th>
              <th className={`${th} text-left`}>{text.longVsShort}</th>
              <th className={`${th} text-right`}>{text.avgDuration}</th>
              <th className={`${th} text-right`}>{text.avgGain}</th>
              <th className={`${th} pr-4 text-right`}>{text.totalGain}</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.symbol} className="ui-row">
                <td className="px-3 py-2 pl-4 text-[13px]">
                  <Link href={buildTradeHistoryHref({ ...scope, symbol: row.symbol })} className="ui-link font-medium">{row.symbol}</Link>
                </td>
                <td className={`${td} text-right text-ink`}>{row.tradeCount}</td>
                <td className={`${td} text-right text-ink`}>{row.winRate.toFixed(0)}%</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24"><SplitBar a={row.longPercent} b={row.shortPercent} height={4} /></div>
                    <span className="ui-num text-[11px] text-ink-3">{row.longPercent.toFixed(0)}% / {row.shortPercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className={`${td} text-right text-ink-2`}>{formatHoldDuration(row.avgDuration, locale)}</td>
                <td className={`${td} text-right ${row.avgGain >= 0 ? "text-profit" : "text-loss"}`}>
                  {formatMoney(row.avgGain)}
                </td>
                <td className={`${td} pr-4 text-right font-medium ${row.totalGain >= 0 ? "text-profit" : "text-loss"}`}>
                  {formatMoney(row.totalGain)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2">
          <span className="ui-num text-[12px] text-ink-3">{startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, data.length)} / {data.length}</span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label={text.previousAria} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1} className="ui-button h-7 text-[12px]">
              {text.previous}
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                key={page}
                aria-label={`${text.pageAria} ${page}`}
                aria-current={safePage === page ? "page" : undefined}
                onClick={() => setCurrentPage(page)}
                className={`ui-button ui-num h-7 min-w-7 justify-center px-2 text-[12px] ${safePage === page ? "border-line-strong bg-surface-3 text-ink" : "border-transparent"}`}
              >
                {page}
              </button>
            ))}
            <button type="button" aria-label={text.nextAria} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage === totalPages} className="ui-button h-7 text-[12px]">
              {text.next}
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
