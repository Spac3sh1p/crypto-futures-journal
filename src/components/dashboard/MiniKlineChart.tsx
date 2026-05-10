"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
} from "recharts";

interface MiniKlineChartProps {
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  side: string;
}

function generateMockPriceData(entryPrice: number, exitPrice: number, points: number) {
  const data: { time: string; price: number }[] = [];
  const volatility = Math.abs(exitPrice - entryPrice) * 0.8;

  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const trend = entryPrice + (exitPrice - entryPrice) * progress;
    const noise = (Math.random() - 0.5) * volatility * Math.sin(progress * Math.PI);
    data.push({
      time: `${i}`,
      price: trend + noise,
    });
  }
  return data;
}

export function MiniKlineChart({ entryPrice, exitPrice, entryTime, exitTime, side }: MiniKlineChartProps) {
  const data = generateMockPriceData(entryPrice, exitPrice, 60);
  const prices = data.map((d) => d.price);
  const maePrice = side === "Long" ? Math.min(...prices) : Math.max(...prices);
  const mfePrice = side === "Long" ? Math.max(...prices) : Math.min(...prices);
  const minY = Math.min(...prices) * 0.999;
  const maxY = Math.max(...prices) * 1.001;

  const entryDate = new Date(entryTime);
  const exitDate = new Date(exitTime);
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-2">
        <select className="bg-bg-tertiary border border-border rounded px-2 py-1 text-xs text-text-secondary">
          <option>1m Timeframe</option>
        </select>
        <span className="text-xs text-text-muted">Full Screen</span>
        <span className="ml-auto text-xs text-text-muted">Filter</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 20, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
          <XAxis dataKey="time" hide />
          <YAxis
            domain={[minY, maxY]}
            tick={{ fill: "#5e6673", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(2)}`}
            width={60}
          />
          <ReferenceLine y={entryPrice} stroke="#f0b90b" strokeDasharray="5 5" strokeWidth={1} />
          <ReferenceDot x="0" y={entryPrice} r={6} fill="#0ecb81" stroke="none" />
          <ReferenceDot x="60" y={exitPrice} r={6} fill="#f6465d" stroke="none" />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#5e6673"
            strokeWidth={1}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="absolute bottom-6 left-16 flex items-center gap-2">
        <span className="bg-green text-bg-primary text-[10px] font-bold px-2 py-0.5 rounded">Open</span>
      </div>
      <div className="absolute bottom-6 right-4 flex items-center gap-2">
        <span className="bg-red text-white text-[10px] font-bold px-2 py-0.5 rounded">Close</span>
      </div>
      <div className="absolute top-8 left-20 text-[10px] text-text-muted">
        MFE ${mfePrice.toFixed(2)}
      </div>
      <div className="absolute bottom-16 left-20 text-[10px] text-text-muted">
        MAE ${maePrice.toFixed(2)}
      </div>
    </div>
  );
}
