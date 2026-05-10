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

export function CumulativePnlChart({ data }: { data: DataPoint[] }) {
  const gradientOffset = useMemo(() => {
    if (data.length === 0) return 0;
    const max = Math.max(...data.map((d) => d.value));
    const min = Math.min(...data.map((d) => d.value));
    if (max <= 0) return 0;
    if (min >= 0) return 1;
    return max / (max - min);
  }, [data]);

  return (
    <div className="bg-bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
        Cumulative PnL
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="pnlStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#0ecb81" />
              <stop offset={gradientOffset} stopColor="#0ecb81" />
              <stop offset={gradientOffset} stopColor="#f6465d" />
              <stop offset={1} stopColor="#f6465d" />
            </linearGradient>
            <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#0ecb81" stopOpacity={0.12} />
              <stop offset={gradientOffset} stopColor="#0ecb81" stopOpacity={0.12} />
              <stop offset={gradientOffset} stopColor="#f6465d" stopOpacity={0.12} />
              <stop offset={1} stopColor="#f6465d" stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#5e6673", fontSize: 11 }}
            axisLine={{ stroke: "#2b3139" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#5e6673", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
          />
          <ReferenceLine y={0} stroke="#5e6673" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{
              background: "#1b1f27",
              border: "1px solid #2b3139",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#848e9c" }}
            formatter={(value) => [
              `$${Number(value).toFixed(2)}`,
              "Cumulative PnL",
            ]}
          />
          <Area
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
