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

interface DataPoint {
  date: string;
  value: number;
}

interface ChartPoint extends DataPoint {
  pct: number;
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

  return (
    <div className="bg-bg-secondary rounded-[14px] p-5 border border-border">
      <h3 className="text-[10px] font-bold text-yellow uppercase tracking-[0.2em] font-display mb-4">
        Cumulative PnL
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData}>
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
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
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
            labelStyle={{ color: "#94A3B8" }}
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
  );
}
