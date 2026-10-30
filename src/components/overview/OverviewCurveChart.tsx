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
import { getPositiveAnchoredDomain } from "@/lib/dashboard/chart-axis";

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
  const prefix = value < 0 ? "-$" : "$";
  if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(1)}k`;
  return `${prefix}${abs.toFixed(0)}`;
}

function formatPercentTick(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : 1;
  return `${value.toFixed(digits)}%`;
}

function formatPercentValue(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : 1;
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function OverviewCurveChart({ data }: { data: DataPoint[] }) {
  const { dictionary } = useI18n();
  const text = dictionary.overview;
  const moneyDomain = useMemo(() => {
    return getPositiveAnchoredDomain(data.map((point) => point.value));
  }, [data]);
  const returnDomain = useMemo(() => {
    return getPositiveAnchoredDomain(
      data
        .map((point) => point.returnPct)
        .filter((value): value is number => typeof value === "number")
    );
  }, [data]);
  const hasReturnPct = useMemo(() => {
    return data.some((point) => typeof point.returnPct === "number" && Number.isFinite(point.returnPct));
  }, [data]);
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
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: hasReturnPct ? 8 : 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="overviewPnlStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#41D1A0" />
              <stop offset={gradientOffset} stopColor="#41D1A0" />
              <stop offset={gradientOffset} stopColor="#FF5A5F" />
              <stop offset={1} stopColor="#FF5A5F" />
            </linearGradient>
            <linearGradient id="overviewPnlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#41D1A0" stopOpacity={0.22} />
              <stop offset={0.62} stopColor="#41D1A0" stopOpacity={0.07} />
              <stop offset={1} stopColor="#080B10" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2A3442" strokeDasharray="3 5" strokeOpacity={0.54} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9FAEC1", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatAxisDate}
            minTickGap={30}
          />
          <YAxis
            yAxisId="left"
            domain={moneyDomain}
            allowDataOverflow
            tick={{ fill: "#9FAEC1", fontSize: 11, fontWeight: 650 }}
            axisLine={false}
            tickLine={false}
            width={58}
            tickFormatter={formatMoneyTick}
          />
          {hasReturnPct && (
            <YAxis
              yAxisId="right"
              orientation="right"
              dataKey="returnPct"
              domain={returnDomain}
              allowDataOverflow
              tick={{ fill: "#9FAEC1", fontSize: 11, fontWeight: 650 }}
              axisLine={false}
              tickLine={false}
              width={62}
              tickFormatter={(value) => formatPercentTick(Number(value))}
            />
          )}
          <ReferenceLine yAxisId="left" y={0} stroke="var(--text-muted)" strokeDasharray="3 4" />
          <Tooltip
            contentStyle={{
              background: "#0C1522",
              border: "1px solid #2A3442",
              borderRadius: 8,
              boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
              color: "#F4F7FA",
              fontSize: 12,
            }}
            labelStyle={{ color: "#C1CAD6", fontWeight: 600 }}
            formatter={(value, _name, item) => {
              const payload = item.payload as DataPoint;
              const pct = typeof payload.returnPct === "number" ? ` (${formatPercentValue(payload.returnPct)})` : "";
              return [`$${Number(value).toFixed(2)}${pct}`, text.mainCurve];
            }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="value"
            stroke="url(#overviewPnlStroke)"
            fill="url(#overviewPnlFill)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, stroke: "#080B10", strokeWidth: 2, fill: "#D8A443" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
