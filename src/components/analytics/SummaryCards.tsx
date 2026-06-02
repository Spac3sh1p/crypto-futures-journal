"use client";

import { formatDuration } from "@/lib/formatters";
import { useI18n } from "@/components/i18n/LanguageProvider";

interface SummaryCardsProps {
  totalTrades: number;
  avgHold: number;
  winRate: number;
  winCount: number;
  lossCount: number;
  longCount: number;
  shortCount: number;
}

export function SummaryCards({
  totalTrades, avgHold, winRate, winCount, lossCount, longCount, shortCount,
}: SummaryCardsProps) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.analytics.summary;
  const longPct = totalTrades > 0 ? (longCount / totalTrades) * 100 : 50;
  const shortPct = 100 - longPct;

  return (
    <section data-summary-strip="true" className="trading-panel px-4 py-3">
      <div className="grid grid-cols-1 divide-y divide-border-light md:grid-cols-4 md:divide-x md:divide-y-0">
        <div className="py-2 md:px-4 md:first:pl-0">
          <span className="terminal-label">{text.totalTrades}</span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono text-xl font-bold text-text-primary tabular-nums">{totalTrades}</span>
            <span className="text-xs font-medium text-text-muted">
              {winCount}{dictionary.common.wins} / {lossCount}{dictionary.common.losses}
            </span>
          </div>
        </div>

        <div className="py-2 md:px-4">
          <span className="terminal-label">{text.avgHold}</span>
          <p className="mt-1 font-mono text-xl font-bold text-text-primary tabular-nums">
            {formatDuration(avgHold, locale)}
          </p>
        </div>

        <div className="py-2 md:px-4">
          <div className="flex items-center justify-between gap-3">
            <span className="terminal-label">{text.winRate}</span>
            <span className="font-mono text-lg font-bold text-green tabular-nums">{winRate.toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-red-dim">
            <div className="h-full rounded-full bg-green" style={{ width: `${winRate}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-medium text-text-muted">
            <span>{winCount}{dictionary.common.wins}</span>
            <span>{lossCount}{dictionary.common.losses}</span>
          </div>
        </div>

        <div className="py-2 md:px-4 md:last:pr-0">
          <div className="flex items-center justify-between gap-3">
            <span className="terminal-label">{text.longShortRatio}</span>
            <span className="font-mono text-sm font-semibold text-text-secondary tabular-nums">
              {longPct.toFixed(0)}% / {shortPct.toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full">
            <div className="bg-green" style={{ width: `${longPct}%` }} />
            <div className="bg-red" style={{ width: `${shortPct}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-medium text-text-muted">
            <span>{dictionary.common.long} {longCount}</span>
            <span>{dictionary.common.short} {shortCount}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
