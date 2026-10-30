"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildNiceScale } from "@/lib/dashboard/chart-ticks";
import type { CurvePoint } from "@/lib/dashboard/overview-model";

const CHART_HEIGHT = 272;
const AXIS_FONT = "var(--ui-font-sans)";

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

function formatPercent(value: number, signed = false): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : 1;
  return `${signed && value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatMoneyValue(value: number): string {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface TooltipPayloadItem {
  payload?: CurvePoint;
}

function ChartTooltip({
  active,
  payload,
  label,
  seriesName,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  seriesName: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const tone = point.value >= 0 ? "var(--ui-profit)" : "var(--ui-loss)";
  return (
    <div className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 text-[12px] text-ink-3">
      <div className="ui-num">{String(label)}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: tone }} aria-hidden="true" />
        <span className="ui-num text-[13px] font-medium text-ink">{formatMoneyValue(point.value)}</span>
        {typeof point.returnPct === "number" && (
          <span className="ui-num text-ink-2">{formatPercent(point.returnPct, true)}</span>
        )}
        <span>{seriesName}</span>
      </div>
    </div>
  );
}

export function EquityChart({
  data,
  seriesName,
  emptyText,
}: {
  data: CurvePoint[];
  seriesName: string;
  emptyText: string;
}) {
  const moneyScale = useMemo(() => buildNiceScale(data.map((point) => point.value)), [data]);
  const returnScale = useMemo(
    () => buildNiceScale(data.map((point) => point.returnPct).filter((value): value is number => typeof value === "number")),
    [data]
  );
  const hasReturnPct = useMemo(
    () => data.some((point) => typeof point.returnPct === "number" && Number.isFinite(point.returnPct)),
    [data]
  );
  const zeroOffset = useMemo(() => {
    if (data.length === 0) return 1;
    const max = Math.max(...data.map((point) => point.value));
    const min = Math.min(...data.map((point) => point.value));
    if (max <= 0) return 0;
    if (min >= 0) return 1;
    return max / (max - min);
  }, [data]);
  const last = data.at(-1);

  if (data.length === 0) {
    return (
      <div className="mx-5 mb-5 flex items-center justify-center rounded-md border border-line bg-canvas text-[13px] text-ink-3" style={{ height: CHART_HEIGHT }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className="min-w-[520px] md:min-w-0" style={{ height: CHART_HEIGHT }}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart data={data} margin={{ top: 16, right: hasReturnPct ? 4 : 20, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="v2EquityStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="var(--ui-profit)" />
              <stop offset={zeroOffset} stopColor="var(--ui-profit)" />
              <stop offset={zeroOffset} stopColor="var(--ui-loss)" />
              <stop offset={1} stopColor="var(--ui-loss)" />
            </linearGradient>
            <linearGradient id="v2EquityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="var(--ui-profit)" stopOpacity={0.14} />
              <stop offset={zeroOffset} stopColor="var(--ui-profit)" stopOpacity={0.02} />
              <stop offset={zeroOffset} stopColor="var(--ui-loss)" stopOpacity={0.02} />
              <stop offset={1} stopColor="var(--ui-loss)" stopOpacity={0.14} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--ui-line)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--ui-ink-3)", fontSize: 11, fontFamily: AXIS_FONT }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatAxisDate}
            minTickGap={36}
            dy={6}
          />
          <YAxis
            yAxisId="left"
            domain={moneyScale.domain}
            ticks={moneyScale.ticks}
            tick={{ fill: "var(--ui-ink-3)", fontSize: 11, fontFamily: AXIS_FONT }}
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={formatMoneyTick}
          />
          {hasReturnPct && (
            <YAxis
              yAxisId="right"
              orientation="right"
              dataKey="returnPct"
              domain={returnScale.domain}
              ticks={returnScale.ticks}
              tick={{ fill: "var(--ui-ink-3)", fontSize: 11, fontFamily: AXIS_FONT }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(value) => formatPercent(Number(value))}
            />
          )}
          <ReferenceLine yAxisId="left" y={0} stroke="var(--ui-line-strong)" />
          <Tooltip
            cursor={{ stroke: "var(--ui-line-strong)", strokeWidth: 1 }}
            content={<ChartTooltip seriesName={seriesName} />}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="value"
            stroke="url(#v2EquityStroke)"
            fill="url(#v2EquityFill)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--ui-surface)", fill: "var(--ui-ink)" }}
            isAnimationActive={false}
          />
          {last && (
            <ReferenceDot
              yAxisId="left"
              x={last.date}
              y={last.value}
              r={4}
              fill={last.value >= 0 ? "var(--ui-profit)" : "var(--ui-loss)"}
              stroke="var(--ui-surface)"
              strokeWidth={2}
              ifOverflow="visible"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
