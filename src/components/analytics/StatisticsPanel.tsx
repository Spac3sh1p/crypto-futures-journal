"use client";

import type { Statistics } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";

function formatMoney(val: number): string {
  const prefix = val >= 0 ? "+$" : "-$";
  return `${prefix}${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StatisticsPanel({ stats }: { stats: Statistics }) {
  const { dictionary } = useI18n();
  const text = dictionary.analytics.statistics;
  const leftRows = [
    { label: text.totalGainLoss, value: formatMoney(stats.totalGainLoss), color: stats.totalGainLoss >= 0 ? "text-green" : "text-red" },
    { label: text.avgDailyGain, value: `${formatMoney(stats.avgDailyGain)} (${template(text.days, { days: stats.tradingDays })})`, color: stats.avgDailyGain >= 0 ? "text-green" : "text-red" },
    { label: text.avgDailyVolume, value: `$${stats.avgDailyVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${template(text.days, { days: stats.tradingDays })})`, color: "text-text-primary" },
    { label: text.largestGain, value: formatMoney(stats.largestGain), color: "text-green" },
    { label: text.largestLoss, value: formatMoney(stats.largestLoss), color: "text-red" },
  ];

  const rightRows = [
    { label: text.avgTradeWin, value: formatMoney(stats.avgTradeWin), color: "text-green" },
    { label: text.avgTradeLoss, value: formatMoney(stats.avgTradeLoss), color: "text-red" },
    { label: text.maxConsecutiveWin, value: String(stats.maxConsecutiveWin), color: "text-text-primary" },
    { label: text.maxConsecutiveLoss, value: String(stats.maxConsecutiveLoss), color: "text-text-primary" },
    { label: text.totalTradesVolume, value: `$${(stats.totalTradesVolume / 1000000).toFixed(1)}M`, color: "text-text-primary" },
  ];

  return (
    <div className="trading-panel p-6">
      <h3 className="terminal-section-title mb-5">{text.title}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
        <div>
          {leftRows.map((r) => (
            <div key={r.label} className="flex justify-between items-center py-3 border-b border-border-light last:border-b-0">
              <span className="text-sm text-text-muted">{r.label}</span>
              <span className={`text-sm font-mono font-medium ${r.color}`}>{r.value}</span>
            </div>
          ))}
        </div>
        <div>
          {rightRows.map((r) => (
            <div key={r.label} className="flex justify-between items-center py-3 border-b border-border-light last:border-b-0">
              <span className="text-sm text-text-muted">{r.label}</span>
              <span className={`text-sm font-mono font-medium ${r.color}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
