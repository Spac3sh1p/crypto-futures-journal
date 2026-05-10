"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  drawdown: number;
}

export function DrawdownChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
        Drawdown
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
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
            tickFormatter={(v) => `$${v}`}
          />
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
              "Drawdown",
            ]}
          />
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#f6465d"
            fill="rgba(246,70,93,0.15)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
