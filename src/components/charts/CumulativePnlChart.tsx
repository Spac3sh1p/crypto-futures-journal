"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { InfoHint } from "@/components/ui/InfoHint";

interface DataPoint {
  date: string;
  value: number;
}

interface ChartPoint extends DataPoint {
  pct: number;
}

function formatAxisDate(date: string): string {
  const [, month, day] = date.split("-");
  return month && day ? `${month}/${day}` : date;
}

function formatMoneyTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

export function CumulativePnlChart({ data, initialCapital = 10000 }: { data: DataPoint[]; initialCapital?: number }) {
  const chartData: ChartPoint[] = useMemo(() => {
    return data.map((d) => ({
      ...d,
      pct: initialCapital > 0 ? (d.value / initialCapital) * 100 : 0,
    }));
  }, [data, initialCapital]);

  const gradientOffset = useMemo(() => {
    if (chartData.length === 0) return 0;
    const max = Math.max(...chartData.map((d) => d.value));
    const min = Math.min(...chartData.map((d) => d.value));
    if (max <= 0) return 0;
    if (min >= 0) return 1;
    return max / (max - min);
  }, [chartData]);
  const latestValue = chartData.at(-1)?.value ?? 0;

  return (
    <div className="bg-bg-secondary rounded-[14px] p-5 border border-border">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow">
              Cumulative PnL
            </h3>
            <InfoHint label="Cumulative sum of realised PnL grouped by trade exit date." />
          </div>
          <p className="mt-1 text-xs font-medium text-text-muted">Daily realised equity curve</p>
        </div>
        <div className={`font-mono text-sm font-semibold tabular-nums ${latestValue >= 0 ? "text-green" : "text-red"}`}>
          {latestValue >= 0 ? "+" : ""}${latestValue.toFixed(2)}
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center rounded border border-border-light bg-bg-primary/30 text-sm font-medium text-text-muted">
          No realised PnL data in this range.
        </div>
      ) : (
        <div className="-mx-2 overflow-x-auto px-2">
          <div className="h-[240px] min-w-[640px] md:min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlStroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={0} stopColor="#10B981" />
                    <stop offset={gradientOffset} stopColor="#10B981" />
                    <stop offset={gradientOffset} stopColor="#EF4444" />
                    <stop offset={1} stopColor="#EF4444" />
                  </linearGradient>
                  <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={0} stopColor="#F59E0B" stopOpacity={0.08} />
                    <stop offset={gradientOffset} stopColor="#10B981" stopOpacity={0.12} />
                    <stop offset={gradientOffset} stopColor="#EF4444" stopOpacity={0.12} />
                    <stop offset={1} stopColor="#EF4444" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  tickFormatter={formatAxisDate}
                  minTickGap={28}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                  tickFormatter={formatMoneyTick}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  dataKey="pct"
                />
                <ReferenceLine yAxisId="left" y={0} stroke="#64748B" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    background: "#1E293B",
                    border: "1px solid #334155",
                    borderRadius: 10,
                    fontSize: 12,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: "#94A3B8", fontWeight: 600 }}
                  formatter={(value) => [
                    `$${Number(value).toFixed(2)}`,
                    "Cumulative PnL",
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="value"
                  stroke="url(#pnlStroke)"
                  fill="url(#pnlFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
