"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

export function TradeCountChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
        Trade Count
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} />
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
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1b1f27",
              border: "1px solid #2b3139",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#848e9c" }}
          />
          <Bar dataKey="count" fill="#f0b90b" radius={[2, 2, 0, 0]} opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
