"use client";

import type { DurationSizeBucket } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";

export function SizeReport({ data }: { data: DurationSizeBucket[] }) {
  const { dictionary } = useI18n();
  const text = dictionary.analytics.reports;
  const maxTotal = Math.max(...data.map((d) => d.wins + d.losses), 1);

  return (
    <div className="trading-panel p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-1">{text.sizeTitle}</h3>
      <p className="text-[10px] text-text-muted mb-4">{text.sizeSubtitle}</p>
      <div className="flex items-center gap-4 mb-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green" /> {dictionary.common.win}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red" /> {dictionary.common.loss}</span>
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
