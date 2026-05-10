"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface GroupData {
  name: string;
  winRate: number;
  tradeCount: number;
}

const COLORS = ["#0ecb81", "#f0b90b", "#1e90ff", "#f6465d", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

export function WinRateDonutChart({ data }: { data: GroupData[] }) {
  const chartData = data.map((d) => ({
    name: d.name,
    value: d.tradeCount,
    winRate: d.winRate,
  }));

  return (
    <div className="bg-bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
        Distribution & Win Rate
      </h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1b1f27",
                border: "1px solid #2b3139",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, _, entry: any) => [
                `${Number(value)} trades (${entry.payload.winRate.toFixed(1)}% WR)`,
                entry.payload.name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2">
          {data.slice(0, 6).map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-text-secondary w-20 truncate">
                {d.name}
              </span>
              <span className="font-mono text-text-primary">
                {d.winRate.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
