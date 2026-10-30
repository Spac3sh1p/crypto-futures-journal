"use client";

import type { WinLossRow } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { formatDuration } from "@/lib/formatters";
import { Panel, PanelHeader } from "@/components/v2/ui/Panel";

export function WinLossTableV2({ title, rows, isWin }: { title: string; rows: WinLossRow[]; isWin: boolean }) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.analytics.winLossTable;
  const th = "px-5 py-2.5 text-[12px] font-normal text-ink-3";
  const td = "v2-num px-5 py-2.5 text-[13px]";

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isWin ? "bg-profit" : "bg-loss"}`} aria-hidden="true" />
            <span>{title}</span>
          </span>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr>
              <th className={`${th} text-left`}>{text.type}</th>
              <th className={`${th} text-right`}>{text.trades}</th>
              <th className={`${th} text-right`}>{text.avgDuration}</th>
              <th className={`${th} text-right`}>{text.avgSize}</th>
              <th className={`${th} text-right`}>{isWin ? text.avgGain : text.avgLoss}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.type} className="v2-row">
                <td className="px-5 py-2.5 text-[13px] text-ink">
                  {row.type === "Long" ? dictionary.common.long : row.type === "Short" ? dictionary.common.short : dictionary.common.both}
                </td>
                <td className={`${td} text-right text-ink`}>{row.count}</td>
                <td className={`${td} text-right text-ink-2`}>{row.count === 0 ? "--" : formatDuration(row.avgDuration, locale)}</td>
                <td className={`${td} text-right text-ink-2`}>{row.count === 0 ? "--" : `$${row.avgSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</td>
                <td className={`${td} text-right font-medium ${row.count === 0 ? "text-ink-3" : isWin ? "text-profit" : "text-loss"}`}>
                  {row.count === 0 ? "--" : `${isWin ? "+" : "-"}$${Math.abs(row.avgGainLoss).toFixed(2)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
