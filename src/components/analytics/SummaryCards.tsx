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
  const circumference = 2 * Math.PI * 36;
  const winArc = (winRate / 100) * circumference;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Trades */}
      <div className="trading-card p-5">
        <span className="terminal-label">{text.totalTrades}</span>
        <p className="text-2xl font-bold font-mono text-text-primary mt-1">{totalTrades}</p>
      </div>

      {/* Avg Hold */}
      <div className="trading-card p-5">
        <span className="terminal-label">{text.avgHold}</span>
        <p className="text-2xl font-bold font-mono text-text-primary mt-1">{formatDuration(avgHold, locale)}</p>
      </div>

      {/* Win Rate Donut */}
      <div className="trading-card p-5">
        <span className="terminal-label">{text.winRate}</span>
        <div className="flex items-center gap-3 mt-1">
          <div className="relative">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#26364B" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke="#10B981" strokeWidth="6"
                strokeDasharray={`${winArc} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-mono text-text-primary">
              {winRate.toFixed(0)}%
            </span>
          </div>
          <div className="text-[10px] text-text-muted space-y-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green" />
              <span>{winCount}{dictionary.common.wins}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red" />
              <span>{lossCount}{dictionary.common.losses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Long / Short Ratio */}
      <div className="trading-card p-5">
        <span className="terminal-label">{text.longShortRatio}</span>
        <div className="mt-3">
          <div className="h-4 w-full rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-red" />
            <div className="absolute top-0 left-0 h-full bg-green rounded-l-full" style={{ width: `${longPct}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-text-muted font-mono">
            <span>{longPct.toFixed(0)}%({longCount})</span>
            <span>{shortPct.toFixed(0)}%({shortCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
