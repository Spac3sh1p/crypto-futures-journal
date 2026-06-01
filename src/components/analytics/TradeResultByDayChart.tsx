"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { DayTimeBar } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";

export function TradeResultByDayChart({ data }: { data: DayTimeBar[] }) {
  const { dictionary } = useI18n();
  const text = dictionary.analytics.charts;
  const chartData = data.map((item) => ({
    ...item,
    label: dictionary.analytics.days[item.label as keyof typeof dictionary.analytics.days] ?? item.label,
  }));

  return (
    <div className="trading-panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="terminal-section-title">{text.resultByDay}</h3>
        <span className="rounded bg-bg-tertiary px-2 py-1 text-[10px] text-text-muted">{text.groupByOpen}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 5" stroke="#26364B" strokeOpacity={0.62} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#8190A6", fontSize: 11 }} axisLine={{ stroke: "#26364B" }} tickLine={false} />
          <YAxis tick={{ fill: "#8190A6", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "#0C1522", border: "1px solid #2B3D55", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
            labelStyle={{ color: "#BBC7D6" }}
            itemStyle={{ color: "#F3F7FC" }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, dictionary.common.pnl]}
            cursor={{ fill: "rgba(125, 180, 255, 0.08)" }}
          />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? "#22C38E" : "#FF5A5F"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
