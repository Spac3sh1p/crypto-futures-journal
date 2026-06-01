"use client";

import type { SideBreakdownData } from "@/lib/dashboard/analytics-transforms";
import { formatDuration } from "@/lib/formatters";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";

export function SideBreakdown({ data }: { data: SideBreakdownData }) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.analytics.side;
  const isLong = data.side === "Long";
  const sideLabel = isLong ? dictionary.common.long : dictionary.common.short;
  const accentColor = isLong ? "bg-green" : "bg-red";
  const circumference = 2 * Math.PI * 46;
  const winArc = (data.winRate / 100) * circumference;

  return (
    <div className={`trading-panel p-4 ${isLong ? "shadow-[inset_3px_0_0_var(--green)]" : "shadow-[inset_3px_0_0_var(--red)]"}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Count */}
        <div className="flex flex-col items-center justify-center py-2">
          <span className="text-base font-semibold text-text-primary">{template(text.countTitle, { side: sideLabel })}</span>
          <p className="text-5xl font-bold font-mono text-text-primary mt-3">{data.count}</p>
          <div className="w-32 h-2.5 rounded-full bg-border-light mt-4 overflow-hidden">
            <div className={`h-full rounded-full ${accentColor}`} style={{ width: `${data.percentage}%` }} />
          </div>
          <span className="text-xs text-text-muted mt-2">
            {template(text.percentage, { percent: data.percentage.toFixed(0), side: sideLabel })}
          </span>
        </div>

        {/* Win Ratio */}
        <div className="flex flex-col items-center justify-center py-2">
          <span className="text-base font-semibold text-text-primary">{template(text.winRatio, { side: sideLabel })}</span>
          <div className="relative mt-3">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="46" fill="none" stroke="#26364B" strokeWidth="7" />
              <circle
                cx="55" cy="55" r="46" fill="none"
                stroke={isLong ? "#22C38E" : "#FF5A5F"}
                strokeWidth="7"
                strokeDasharray={`${winArc} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 55 55)"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-text-primary">
              {data.winRate.toFixed(1)}%
            </span>
          </div>
          <span className="text-xs text-text-muted mt-2">
            {template(text.winsLosses, { wins: data.winCount, losses: data.lossCount })}
          </span>
        </div>

        {/* Avg Duration */}
        <div className="flex flex-col justify-center py-2">
          <span className="text-base font-semibold text-text-primary">{template(text.avgDuration, { side: sideLabel })}</span>
          <p className="text-xl font-mono text-text-primary mt-3">{formatDuration(data.avgDuration, locale)}</p>
          <div className="mt-3 space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-text-muted mb-0.5">
                <span>{text.winAbove}</span>
              </div>
              <div className="h-2 rounded-full bg-border-light overflow-hidden">
                <div className="h-full rounded-full bg-green" style={{ width: `${data.winPercentAbove}%` }} />
              </div>
              <span className="text-[10px] text-text-muted">{data.winPercentAbove.toFixed(1)}%</span>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-text-muted mb-0.5">
                <span>{text.winBelow}</span>
              </div>
              <div className="h-2 rounded-full bg-border-light overflow-hidden">
                <div className="h-full rounded-full bg-red" style={{ width: `${data.winPercentBelow}%` }} />
              </div>
              <span className="text-[10px] text-text-muted">{data.winPercentBelow.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Total PNL */}
        <div className="flex flex-col items-center justify-center py-2">
          <span className="text-base font-semibold text-text-primary">{template(text.totalPnl, { side: sideLabel })}</span>
          <div className="mt-3 w-full">
            <div className={`h-8 rounded-lg flex items-center justify-center ${data.totalPnl >= 0 ? "bg-green/20" : "bg-red/20"}`}>
              <span className={`text-base font-mono font-bold ${data.totalPnl >= 0 ? "text-green" : "text-red"}`}>
                {data.totalPnl >= 0 ? "+" : ""}${data.totalPnl.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-3 text-sm space-y-1">
            <div className="text-green font-mono">{text.avgWin} ${data.avgWin.toFixed(2)}</div>
            <div className="text-red font-mono">{text.avgLoss} ${data.avgLoss.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
