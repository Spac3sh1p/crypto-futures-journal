"use client";

import type { SideBreakdownData } from "@/lib/dashboard/analytics-transforms";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

export function SideBreakdown({ data }: { data: SideBreakdownData }) {
  const isLong = data.side === "Long";
  const borderColor = isLong ? "border-l-green" : "border-l-red";
  const accentColor = isLong ? "bg-green" : "bg-red";
  const circumference = 2 * Math.PI * 36;
  const winArc = (data.winRate / 100) * circumference;

  return (
    <div className={`bg-bg-secondary rounded-lg border border-border border-l-4 ${borderColor} p-4`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Count */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-sm font-semibold text-text-primary">{data.side}s</span>
          <p className="text-3xl font-bold font-mono text-text-primary mt-2">{data.count}</p>
          <div className="w-24 h-2 rounded-full bg-[#2b3139] mt-3 overflow-hidden">
            <div className={`h-full rounded-full ${accentColor}`} style={{ width: `${data.percentage}%` }} />
          </div>
          <span className="text-[10px] text-text-muted mt-1">
            {data.percentage.toFixed(0)}% of all your total trades were {data.side.toUpperCase()}
          </span>
        </div>

        {/* Win Ratio */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-sm font-semibold text-text-primary">{data.side} Trade Win Ratio</span>
          <div className="relative mt-2">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#2b3139" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke={isLong ? "#0ecb81" : "#f6465d"}
                strokeWidth="6"
                strokeDasharray={`${winArc} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">
              {data.winRate.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-text-muted mt-1">
            {data.winCount} Wins / {data.lossCount} Losses
          </span>
        </div>

        {/* Avg Duration */}
        <div className="flex flex-col justify-center">
          <span className="text-sm font-semibold text-text-primary">Avg {data.side} Trade Duration</span>
          <p className="text-lg font-mono text-text-primary mt-2">{formatDuration(data.avgDuration)}</p>
          <div className="mt-3 space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-text-muted mb-0.5">
                <span>Win% above</span>
              </div>
              <div className="h-2 rounded-full bg-[#2b3139] overflow-hidden">
                <div className="h-full rounded-full bg-green" style={{ width: `${data.winPercentAbove}%` }} />
              </div>
              <span className="text-[10px] text-text-muted">{data.winPercentAbove.toFixed(1)}%</span>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-text-muted mb-0.5">
                <span>Win% below</span>
              </div>
              <div className="h-2 rounded-full bg-[#2b3139] overflow-hidden">
                <div className="h-full rounded-full bg-red" style={{ width: `${data.winPercentBelow}%` }} />
              </div>
              <span className="text-[10px] text-text-muted">{data.winPercentBelow.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Total PNL */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-sm font-semibold text-text-primary">Total {data.side} Realised PNL</span>
          <div className="mt-2 w-full">
            <div className={`h-6 rounded flex items-center justify-center ${data.totalPnl >= 0 ? "bg-green/20" : "bg-red/20"}`}>
              <span className={`text-sm font-mono font-bold ${data.totalPnl >= 0 ? "text-green" : "text-red"}`}>
                {data.totalPnl >= 0 ? "+" : ""}${data.totalPnl.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[10px] space-y-0.5">
            <div className="text-green">Avg Win ${data.avgWin.toFixed(2)}</div>
            <div className="text-red">Avg loss ${data.avgLoss.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
