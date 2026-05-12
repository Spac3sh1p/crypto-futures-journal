import type { Statistics } from "@/lib/dashboard/analytics-transforms";

function formatMoney(val: number): string {
  const prefix = val >= 0 ? "+$" : "-$";
  return `${prefix}${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StatisticsPanel({ stats }: { stats: Statistics }) {
  const leftRows = [
    { label: "Total Gain/Loss", value: formatMoney(stats.totalGainLoss), color: stats.totalGainLoss >= 0 ? "text-green" : "text-red" },
    { label: "Avg Daily Gain", value: `${formatMoney(stats.avgDailyGain)} (${stats.tradingDays} days)`, color: stats.avgDailyGain >= 0 ? "text-green" : "text-red" },
    { label: "Avg Daily Volume", value: `$${stats.avgDailyVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${stats.tradingDays} days)`, color: "text-text-primary" },
    { label: "Largest Gain", value: formatMoney(stats.largestGain), color: "text-green" },
    { label: "Largest Loss", value: formatMoney(stats.largestLoss), color: "text-red" },
  ];

  const rightRows = [
    { label: "Avg Trade Win", value: formatMoney(stats.avgTradeWin), color: "text-green" },
    { label: "Avg Trade Loss", value: formatMoney(stats.avgTradeLoss), color: "text-red" },
    { label: "Max Consecutive Win", value: String(stats.maxConsecutiveWin), color: "text-text-primary" },
    { label: "Max Consecutive Loss", value: String(stats.maxConsecutiveLoss), color: "text-text-primary" },
    { label: "Total Trades Volume", value: `$${(stats.totalTradesVolume / 1000000).toFixed(1)}M`, color: "text-text-primary" },
  ];

  return (
    <div className="bg-bg-secondary rounded-[14px] border border-border p-6">
      <h3 className="text-[10px] font-bold text-yellow uppercase tracking-[0.2em] font-display mb-5">Statistics</h3>
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
