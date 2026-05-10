"use client";

interface GaugeChartProps {
  label: string;
  value: number;
  sublabel: string;
  color: string;
}

export function GaugeChart({ label, value, sublabel, color }: GaugeChartProps) {
  const angle = (value / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const x = 50 + 35 * Math.cos(Math.PI - rad);
  const y = 50 - 35 * Math.sin(Math.PI - rad);

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-text-muted mb-1">{label}</span>
      <svg viewBox="0 0 100 60" className="w-24 h-14">
        <path
          d="M 15 50 A 35 35 0 0 1 85 50"
          fill="none"
          stroke="#2b3139"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={`M 15 50 A 35 35 0 ${angle > 90 ? 1 : 0} 1 ${x} ${50 - (50 - y)}`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx={x} cy={50 - (50 - y)} r="3" fill="white" />
      </svg>
      <span className="text-lg font-bold" style={{ color }}>{value}%</span>
      <span className="text-[10px] text-text-muted">{sublabel}</span>
    </div>
  );
}
