import type { DurationSizeBucket } from "@/lib/dashboard/analytics-transforms";

export function SizeReport({ data }: { data: DurationSizeBucket[] }) {
  const maxTotal = Math.max(...data.map((d) => d.wins + d.losses), 1);

  return (
    <div className="bg-bg-secondary rounded-lg p-5 border border-border">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Trade Size Report</h3>
      <p className="text-[10px] text-text-muted mb-4">A breakdown of your trades segmented by size (USD)</p>
      <div className="flex items-center gap-4 mb-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green" /> Win</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red" /> Loss</span>
      </div>
      <div className="space-y-3">
        {data.map((bucket) => {
          const total = bucket.wins + bucket.losses;
          const winWidth = total > 0 ? (bucket.wins / maxTotal) * 100 : 0;
          const lossWidth = total > 0 ? (bucket.losses / maxTotal) * 100 : 0;
          return (
            <div key={bucket.label} className="flex items-center gap-3">
              <span className="text-[10px] text-text-muted w-24 text-right shrink-0">{bucket.label}</span>
              <div className="flex-1 flex h-5 gap-0.5">
                {winWidth > 0 && (
                  <div className="bg-green rounded-l h-full" style={{ width: `${winWidth}%` }} />
                )}
                {lossWidth > 0 && (
                  <div className="bg-red rounded-r h-full" style={{ width: `${lossWidth}%` }} />
                )}
              </div>
              <span className="text-[10px] text-text-muted w-8">{total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
