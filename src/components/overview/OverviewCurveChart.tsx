"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "@/components/i18n/LanguageProvider";

interface DataPoint {
  date: string;
  value: number;
  returnPct?: number;
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

export function OverviewCurveChart({ data }: { data: DataPoint[] }) {
  const { dictionary } = useI18n();
  const text = dictionary.overview;
  const gradientOffset = useMemo(() => {
    if (data.length === 0) return 1;
    const max = Math.max(...data.map((point) => point.value));
    const min = Math.min(...data.map((point) => point.value));
    if (max <= 0) return 0;
    if (min >= 0) return 1;
    return max / (max - min);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-border-light bg-bg-primary/55 text-sm font-medium text-text-muted">
        {dictionary.performance.cumulative.empty}
      </div>
    );
  }

  return (
    <div className="h-[300px] min-w-[560px] md:min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="overviewPnlStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#22C38E" />
              <stop offset={gradientOffset} stopColor="#22C38E" />
              <stop offset={gradientOffset} stopColor="#FF5A5F" />
              <stop offset={1} stopColor="#FF5A5F" />
            </linearGradient>
            <linearGradient id="overviewPnlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#22C38E" stopOpacity={0.24} />
              <stop offset={0.62} stopColor="#22C38E" stopOpacity={0.08} />
              <stop offset={1} stopColor="#07101B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#26364B" strokeDasharray="3 5" strokeOpacity={0.62} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatAxisDate}
            minTickGap={30}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={formatMoneyTick}
          />
          <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="3 4" />
          <Tooltip
            contentStyle={{
              background: "#0C1522",
              border: "1px solid #2B3D55",
              borderRadius: 8,
              boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
              color: "#F3F7FC",
              fontSize: 12,
            }}
            labelStyle={{ color: "#BBC7D6", fontWeight: 600 }}
            formatter={(value, _name, item) => {
              const payload = item.payload as DataPoint;
              const pct = payload.returnPct === undefined ? "" : ` (${payload.returnPct.toFixed(1)}%)`;
              return [`$${Number(value).toFixed(2)}${pct}`, text.mainCurve];
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="url(#overviewPnlStroke)"
            fill="url(#overviewPnlFill)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, stroke: "#07101B", strokeWidth: 2, fill: "#F5B31A" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
