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

interface DataPoint {
  date: string;
  count: number;
}

function formatAxisDate(date: string): string {
  const [, month, day] = date.split("-");
  return month && day ? `${month}/${day}` : date;
}

export function TradeCountChart({ data }: { data: DataPoint[] }) {
  const totalTrades = data.reduce((sum, point) => sum + point.count, 0);

  return (
    <div className="bg-bg-secondary rounded-[14px] p-5 border border-border">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow">
              Trade Count
            </h3>
            <InfoHint label="Number of closed aggregate trades grouped by exit date." />
          </div>
          <p className="mt-1 text-xs font-medium text-text-muted">Closed trades per day</p>
        </div>
        <div className="font-mono text-sm font-semibold text-text-primary tabular-nums">
          {totalTrades} trades
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center rounded border border-border-light bg-bg-primary/30 text-sm font-medium text-text-muted">
          No closed trades in this range.
        </div>
      ) : (
        <div className="-mx-2 overflow-x-auto px-2">
          <div className="h-[160px] min-w-[640px] md:min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  tickFormatter={formatAxisDate}
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1E293B",
                    border: "1px solid #334155",
                    borderRadius: 10,
                    fontSize: 12,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                  labelStyle={{ color: "#94A3B8", fontWeight: 600 }}
                  itemStyle={{ color: "#8B5CF6" }}
                  cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                />
                <Bar dataKey="count" name="Closed trades" fill="#8B5CF6" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
