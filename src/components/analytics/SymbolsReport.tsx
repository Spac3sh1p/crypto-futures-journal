"use client";

import type { SymbolReport } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n";

function formatDuration(seconds: number, locale: Locale): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (locale === "zh") return `${h}小时 ${m}分`;
  return `${h}h ${m}m`;
}

export function SymbolsReport({ data }: { data: SymbolReport[] }) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.analytics.symbols;

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
            {data.map((row) => (
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
    </div>
  );
}
