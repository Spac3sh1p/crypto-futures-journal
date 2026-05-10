"use client";

interface MaeMfeBarProps {
  mae: number;
  mfe: number;
  avgExitPercent: number;
}

export function MaeMfeBar({ mae, mfe, avgExitPercent }: MaeMfeBarProps) {
  const total = Math.abs(mae) + Math.abs(mfe);
  const maeWidth = total > 0 ? (Math.abs(mae) / total) * 100 : 50;
  const mfeWidth = total > 0 ? (Math.abs(mfe) / total) * 100 : 50;
  const entryPos = maeWidth;
  const exitPos = entryPos + (avgExitPercent / 100) * mfeWidth;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>MAE</span>
        <span>Entry</span>
        <span>MFE</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden flex">
        <div className="h-full bg-[#3a3a3a]" style={{ width: `${maeWidth}%` }}>
          <div className="h-full bg-red/40 rounded-l-full" style={{ width: "60%" }} />
        </div>
        <div className="h-full bg-green/40 rounded-r-full" style={{ width: `${mfeWidth}%` }} />
        <div
          className="absolute top-0 w-0.5 h-full bg-white"
          style={{ left: `${entryPos}%` }}
        />
        {avgExitPercent !== 0 && (
          <div
            className="absolute top-1 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-orange-400"
            style={{ left: `${Math.min(Math.max(exitPos, 2), 98)}%`, transform: "translateX(-50%)" }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px]">
        <span className="text-red">{mae.toFixed(2)}%</span>
        <span className="text-orange-400">Avg Exit</span>
        <span className="text-green">+{mfe.toFixed(2)}%</span>
      </div>
    </div>
  );
}
