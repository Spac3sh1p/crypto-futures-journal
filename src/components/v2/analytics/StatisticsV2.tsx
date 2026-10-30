"use client";

import type { Statistics } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import { formatMoney } from "@/lib/formatters";
import { Panel, PanelHeader } from "@/components/v2/ui/Panel";

interface Row {
  label: string;
  value: string;
  tone?: "profit" | "loss";
}

function toneClass(tone?: "profit" | "loss"): string {
  return tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-ink";
}

function RowList({ rows }: { rows: Row[] }) {
  return (
    <dl>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
          <dt className="text-[13px] text-ink-3">{row.label}</dt>
          <dd className={`v2-num text-[13px] font-medium ${toneClass(row.tone)}`}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StatisticsV2({ stats }: { stats: Statistics }) {
  const { dictionary } = useI18n();
  const text = dictionary.analytics.statistics;
  const days = template(text.days, { days: stats.tradingDays });
  const left: Row[] = [
    { label: text.totalGainLoss, value: formatMoney(stats.totalGainLoss), tone: stats.totalGainLoss >= 0 ? "profit" : "loss" },
    { label: text.avgDailyGain, value: `${formatMoney(stats.avgDailyGain)} (${days})`, tone: stats.avgDailyGain >= 0 ? "profit" : "loss" },
    { label: text.avgDailyVolume, value: `$${stats.avgDailyVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${days})` },
    { label: text.largestGain, value: formatMoney(stats.largestGain), tone: "profit" },
    { label: text.largestLoss, value: formatMoney(stats.largestLoss), tone: "loss" },
  ];
  const right: Row[] = [
    { label: text.avgTradeWin, value: formatMoney(stats.avgTradeWin), tone: "profit" },
    { label: text.avgTradeLoss, value: formatMoney(stats.avgTradeLoss), tone: "loss" },
    { label: text.maxConsecutiveWin, value: String(stats.maxConsecutiveWin) },
    { label: text.maxConsecutiveLoss, value: String(stats.maxConsecutiveLoss) },
    { label: text.totalTradesVolume, value: `$${(stats.totalTradesVolume / 1_000_000).toFixed(1)}M` },
  ];

  return (
    <Panel>
      <PanelHeader title={text.title} />
      <div className="grid grid-cols-1 gap-x-12 px-5 py-2 lg:grid-cols-2">
        <RowList rows={left} />
        <RowList rows={right} />
      </div>
    </Panel>
  );
}
