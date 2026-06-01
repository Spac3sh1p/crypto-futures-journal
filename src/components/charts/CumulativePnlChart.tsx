"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { InfoHint } from "@/components/ui/InfoHint";
import { useI18n } from "@/components/i18n/LanguageProvider";

interface DataPoint {
  date: string;
  value: number;
  returnPct?: number;
  netDeposits?: number;
}

interface ChartPoint extends DataPoint {
  pct?: number;
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

function formatMoneyValue(value: number): string {
  return `${value >= 0 ? "+" : ""}$${value.toFixed(2)}`;
}

function formatPercentValue(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : 1;
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatPercentTick(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : 1;
  return `${value.toFixed(digits)}%`;
}

export function CumulativePnlChart({ data, initialCapital }: { data: DataPoint[]; initialCapital?: number }) {
  const { dictionary } = useI18n();
  const text = dictionary.performance.cumulative;
  const chartData: ChartPoint[] = useMemo(() => {
    return data.map((d) => ({
      ...d,
      pct: d.returnPct ?? (initialCapital && initialCapital > 0 ? (d.value / initialCapital) * 100 : undefined),
    }));
  }, [data, initialCapital]);

  const gradientOffset = useMemo(() => {
    if (chartData.length === 0) return 0;
    const max = Math.max(...chartData.map((d) => d.value));
    const min = Math.min(...chartData.map((d) => d.value));
    if (max <= 0) return 0;
    if (min >= 0) return 1;
    return max / (max - min);
  }, [chartData]);
  const latestValue = chartData.at(-1)?.value ?? 0;
  const latestPct = chartData.at(-1)?.pct;
  const latestDeposits = chartData.at(-1)?.netDeposits;
  const hasReturnPct = chartData.some((point) => point.pct !== undefined);

  return (
    <div className="trading-panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="terminal-section-title">
              {text.title}
            </h3>
            <InfoHint label={text.info} />
          </div>
          <p className="mt-1 text-xs font-medium text-text-muted">{text.subtitle}</p>
        </div>
        <div className="grid min-w-[280px] max-w-full grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded border border-border-light bg-bg-primary/35 px-3 py-2 text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-text-muted">{text.tradingPnl}</div>
            <div className={`mt-1 font-mono text-sm font-semibold tabular-nums ${latestValue >= 0 ? "text-green" : "text-red"}`}>
              {formatMoneyValue(latestValue)}
            </div>
          </div>
          <div className="rounded border border-border-light bg-bg-primary/35 px-3 py-2 text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-text-muted">{text.return}</div>
            <div className={`mt-1 font-mono text-sm font-semibold tabular-nums ${latestPct === undefined ? "text-text-muted" : latestPct >= 0 ? "text-green" : "text-red"}`}>
              {latestPct === undefined ? "--" : formatPercentValue(latestPct)}
            </div>
          </div>
          <div className="col-span-2 rounded border border-border-light bg-bg-primary/35 px-3 py-2 text-right sm:col-span-1">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-text-muted">{text.netDeposits}</div>
            <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-text-primary">
              {latestDeposits === undefined ? "--" : `$${latestDeposits.toFixed(2)}`}
            </div>
          </div>
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center rounded border border-border-light bg-bg-primary/30 text-sm font-medium text-text-muted">
          {text.empty}
        </div>
      ) : (
        <div className="-mx-2 overflow-x-auto px-2">
          <div className="h-[240px] min-w-[640px] md:min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: hasReturnPct ? 24 : 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlStroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={0} stopColor="#22C38E" />
                    <stop offset={gradientOffset} stopColor="#22C38E" />
                    <stop offset={gradientOffset} stopColor="#FF5A5F" />
                    <stop offset={1} stopColor="#FF5A5F" />
                  </linearGradient>
                  <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={0} stopColor="#F5B31A" stopOpacity={0.08} />
                    <stop offset={gradientOffset} stopColor="#22C38E" stopOpacity={0.12} />
                    <stop offset={gradientOffset} stopColor="#FF5A5F" stopOpacity={0.12} />
                    <stop offset={1} stopColor="#FF5A5F" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                  <CartesianGrid strokeDasharray="3 5" stroke="#26364B" strokeOpacity={0.62} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: "#26364B" }}
                  tickLine={false}
                  tickFormatter={formatAxisDate}
                  minTickGap={28}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                  tickFormatter={formatMoneyTick}
                />
                {hasReturnPct && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                    tickFormatter={(v) => formatPercentTick(Number(v))}
                    dataKey="pct"
                  />
                )}
                <ReferenceLine yAxisId="left" y={0} stroke="var(--text-muted)" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    background: "#0C1522",
                    border: "1px solid #2B3D55",
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: "#BBC7D6", fontWeight: 600 }}
                  formatter={(value, _name, item) => {
                    const payload = item.payload as ChartPoint;
                    return [
                      `$${Number(value).toFixed(2)}${payload.pct !== undefined ? ` (${payload.pct.toFixed(1)}%)` : ""}`,
                      text.tooltipName,
                    ];
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="value"
                  stroke="url(#pnlStroke)"
                  fill="url(#pnlFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
