"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayTimeBar } from "@/lib/dashboard/analytics-transforms";
import { buildNiceScale } from "@/lib/dashboard/chart-ticks";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Panel, PanelHeader } from "@/components/v2/ui/Panel";

const CHART_HEIGHT = 236;

/** 柱子数据端 4px 圆角、基线端方角：正值圆顶，负值圆底 */
interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: { pnl?: number };
}
const AXIS_FONT = "var(--v2-font-sans)";

function formatMoneyTick(value: number): string {
  const abs = Math.abs(value);
  const prefix = value < 0 ? "-$" : "$";
  if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(1)}k`;
  return `${prefix}${abs.toFixed(0)}`;
}

function BarTooltip({ active, payload, label, seriesName }: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string | number;
  seriesName: string;
}) {
  const value = Number(payload?.[0]?.value);
  if (!active || !Number.isFinite(value)) return null;
  const tone = value >= 0 ? "var(--v2-profit)" : "var(--v2-loss)";
  return (
    <div className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 text-[12px] text-ink-3">
      <div>{String(label)}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-sm" style={{ background: tone }} aria-hidden="true" />
        <span className="v2-num text-[13px] font-medium text-ink">{value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}</span>
        <span>{seriesName}</span>
      </div>
    </div>
  );
}

export interface ResultBarItem extends DayTimeBar {
  /** 显示用标签（已翻译）；缺省用 label */
  display?: string;
  /** 下钻到交易明细的链接，由服务端页面预先算好 */
  href: string;
}

export function ResultBarChartV2({
  title,
  hint,
  data,
}: {
  title: string;
  hint: string;
  data: ResultBarItem[];
}) {
  const { dictionary } = useI18n();
  const chartData = useMemo(() => data.map((item) => ({ ...item, display: item.display ?? item.label })), [data]);
  const scale = useMemo(() => buildNiceScale(chartData.map((item) => item.pnl)), [chartData]);

  return (
    <Panel>
      <PanelHeader title={title} subtitle={hint} />
      <div className="px-2 pt-4">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 0 }} barCategoryGap="35%">
            <CartesianGrid vertical={false} stroke="var(--v2-line)" />
            <XAxis
              dataKey="display"
              tick={{ fill: "var(--v2-ink-3)", fontSize: 11, fontFamily: AXIS_FONT }}
              axisLine={false}
              tickLine={false}
              interval={0}
              dy={6}
            />
            <YAxis
              domain={scale.domain}
              ticks={scale.ticks}
              tick={{ fill: "var(--v2-ink-3)", fontSize: 11, fontFamily: AXIS_FONT }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={formatMoneyTick}
            />
            <ReferenceLine y={0} stroke="var(--v2-line-strong)" />
            <Tooltip cursor={{ fill: "var(--v2-surface-2)" }} content={<BarTooltip seriesName={dictionary.common.pnl} />} />
            <Bar
              dataKey="pnl"
              maxBarSize={24}
              isAnimationActive={false}
              shape={(props: BarShapeProps) => (
                <Rectangle {...props} radius={(props.payload?.pnl ?? 0) >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]} />
              )}
            >
              {chartData.map((entry) => (
                <Cell key={entry.label} fill={entry.pnl >= 0 ? "var(--v2-profit)" : "var(--v2-loss)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <nav aria-label={title} className="flex flex-wrap items-center gap-1.5 border-t border-line px-5 py-3">
        <span className="mr-1 text-[12px] text-ink-3">{dictionary.tradeFilters.drillDown}</span>
        {chartData.map((item) => (
          <Link key={item.label} href={item.href} className="v2-button h-7 px-2 text-[12px] no-underline">
            {item.display}
          </Link>
        ))}
      </nav>
    </Panel>
  );
}
