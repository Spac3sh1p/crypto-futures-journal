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
    <div className="bg-bg-secondary rounded-[14px] p-5 border border-border">
      <h3 className="text-[10px] font-bold text-yellow uppercase tracking-[0.2em] font-display mb-4">
        Trade Count
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
            labelStyle={{ color: "#94A3B8" }}
            itemStyle={{ color: "#8B5CF6" }}
            cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
          />
          <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
