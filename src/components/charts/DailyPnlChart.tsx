"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  date: string;
  pnl: number;
}

export function DailyPnlChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
        Daily PnL
      </h3>
      <ResponsiveContainer width="100%" height={200}>
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
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "PnL"]}
          />
          <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.pnl >= 0 ? "#0ecb81" : "#f6465d"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
