"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { DayTimeBar } from "@/lib/dashboard/analytics-transforms";

export function TradeResultByTimeChart({ data }: { data: DayTimeBar[] }) {
  return (
    <div className="bg-bg-secondary rounded-lg p-5 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Trade Result By Time</h3>
        <span className="px-2 py-1 bg-bg-tertiary rounded text-[10px] text-text-muted">Group By: Open</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#5e6673", fontSize: 10 }} axisLine={{ stroke: "#2b3139" }} tickLine={false} />
          <YAxis tick={{ fill: "#5e6673", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "#1b1f27", border: "1px solid #2b3139", borderRadius: 8, fontSize: 12 }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "PnL"]}
          />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? "#0ecb81" : "#f6465d"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
