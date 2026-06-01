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
import { InfoHint } from "@/components/ui/InfoHint";
import { useI18n } from "@/components/i18n/LanguageProvider";

interface DataPoint {
  date: string;
  count: number;
  win?: number;
  loss?: number;
}

function formatAxisDate(date: string): string {
  const [, month, day] = date.split("-");
  return month && day ? `${month}/${day}` : date;
}

export function TradeCountChart({ data }: { data: DataPoint[] }) {
  const { dictionary } = useI18n();
  const text = dictionary.performance.tradeCount;
  const totalTrades = data.reduce((sum, point) => sum + point.count, 0);
  const hasSplit = data.some((point) => point.win !== undefined || point.loss !== undefined);

  return (
    <div className="trading-panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="terminal-section-title">
              {text.title}
            </h3>
            <InfoHint label={text.info} />
          </div>
          <p className="mt-1 text-xs font-medium text-text-muted">{text.subtitle}</p>
          {hasSplit && (
            <div className="mt-3 flex items-center gap-4 text-xs font-medium text-text-secondary">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-5 rounded-sm bg-green" />{dictionary.common.win}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-5 rounded-sm bg-red" />{dictionary.common.loss}</span>
            </div>
          )}
        </div>
        <div className="font-mono text-sm font-semibold text-text-primary tabular-nums">
          {totalTrades} {text.totalSuffix}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center rounded-lg border border-border-light bg-bg-primary/45 text-sm font-medium text-text-muted">
          {text.empty}
        </div>
      ) : (
        <div className="-mx-2 overflow-x-auto px-2">
          <div className="h-[240px] min-w-[480px] md:min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 5" stroke="#26364B" strokeOpacity={0.62} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: "#26364B" }}
                  tickLine={false}
                  tickFormatter={formatAxisDate}
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0C1522",
                    border: "1px solid #2B3D55",
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: "#BBC7D6", fontWeight: 600 }}
                  cursor={{ fill: "rgba(125, 180, 255, 0.08)" }}
                />
                {hasSplit ? (
                  <>
                    <Bar dataKey="win" name={dictionary.common.win} fill="#22C38E" radius={[4, 4, 0, 0]} opacity={0.92} />
                    <Bar dataKey="loss" name={dictionary.common.loss} fill="#FF5A5F" radius={[4, 4, 0, 0]} opacity={0.92} />
                  </>
                ) : (
                  <Bar dataKey="count" name={text.tooltipName} fill="#F5B31A" radius={[4, 4, 0, 0]} opacity={0.88} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
