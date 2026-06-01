"use client";

import type { WinLossRow } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n";

function formatDuration(seconds: number, locale: Locale): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (locale === "zh") return `${h}小时 ${m}分 ${s}秒`;
  return `${h}h ${m}m ${s}s`;
}

interface WinLossTableProps {
  title: string;
  rows: WinLossRow[];
  isWin: boolean;
}

export function WinLossTable({ title, rows, isWin }: WinLossTableProps) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.analytics.winLossTable;
  const valueColor = isWin ? "text-green" : "text-red";

  return (
    <div className={`trading-panel overflow-hidden ${isWin ? "shadow-[inset_0_3px_0_var(--green)]" : "shadow-[inset_0_3px_0_var(--red)]"}`}>
      <div className="px-5 py-3">
        <h3 className="terminal-section-title">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-tertiary/42">
            <th className="px-5 py-2 text-left text-xs text-text-muted">{text.type}</th>
            <th className="px-5 py-2 text-center text-xs text-text-muted">{text.trades}</th>
            <th className="px-5 py-2 text-center text-xs text-text-muted">{text.avgDuration}</th>
            <th className="px-5 py-2 text-center text-xs text-text-muted">{text.avgSize}</th>
            <th className="px-5 py-2 text-right text-xs text-text-muted">{isWin ? text.avgGain : text.avgLoss}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.type} className="border-b border-border-light">
              <td className={`px-5 py-3 text-xs font-medium ${row.type === "Long" ? "text-green" : row.type === "Short" ? "text-red" : "text-text-primary"}`}>
                {row.type === "Long" ? dictionary.common.long : row.type === "Short" ? dictionary.common.short : dictionary.common.both}
              </td>
              <td className="px-5 py-3 text-center text-xs font-mono text-text-primary">{row.count}</td>
              <td className="px-5 py-3 text-center text-xs font-mono text-text-secondary">{formatDuration(row.avgDuration, locale)}</td>
              <td className="px-5 py-3 text-center text-xs font-mono text-text-secondary">
                ${row.avgSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </td>
              <td className={`px-5 py-3 text-right text-xs font-mono ${valueColor}`}>
                {isWin ? "+" : "-"}${Math.abs(row.avgGainLoss).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
