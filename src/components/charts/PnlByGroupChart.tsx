"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface GroupData {
  name: string;
  totalPnl: number;
}

export function PnlByGroupChart({ data }: { data: GroupData[] }) {
  return (
    <div className="bg-bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
        PnL by Group
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#5e6673", fontSize: 11 }}
            axisLine={{ stroke: "#2b3139" }}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#848e9c", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: "#1b1f27",
              border: "1px solid #2b3139",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "PnL"]}
          />
          <Bar dataKey="totalPnl" radius={[0, 3, 3, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.totalPnl >= 0 ? "#0ecb81" : "#f6465d"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
