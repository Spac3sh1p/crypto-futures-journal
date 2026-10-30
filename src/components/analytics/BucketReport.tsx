"use client";

import type { DurationSizeBucket } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Panel, PanelHeader } from "@/components/ui/Panel";

export function BucketReport({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: DurationSizeBucket[];
}) {
  const { dictionary } = useI18n();
  const maxTotal = Math.max(...data.map((bucket) => bucket.wins + bucket.losses), 1);

  return (
    <Panel>
      <PanelHeader
        size="sm"
        title={title}
        subtitle={subtitle}
        actions={
          <span className="flex items-center gap-3 text-[11px] text-ink-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-profit" aria-hidden="true" />{dictionary.common.win}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-loss" aria-hidden="true" />{dictionary.common.loss}</span>
          </span>
        }
      />
      <div className="space-y-1.5 px-4 py-3">
        {data.map((bucket) => {
          const total = bucket.wins + bucket.losses;
          const winWidth = (bucket.wins / maxTotal) * 100;
          const lossWidth = (bucket.losses / maxTotal) * 100;
          return (
            <div key={bucket.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-right text-[11px] text-ink-3">{bucket.label}</span>
              <div className="flex h-3 flex-1 items-stretch gap-0.5" role="img" aria-label={`${bucket.label}: ${bucket.wins} ${dictionary.common.win}, ${bucket.losses} ${dictionary.common.loss}`}>
                {winWidth > 0 && <div className="rounded-r-sm bg-profit" style={{ width: `${winWidth}%` }} />}
                {lossWidth > 0 && <div className="rounded-r-sm bg-loss" style={{ width: `${lossWidth}%` }} />}
              </div>
              <span className="ui-num w-8 shrink-0 text-right text-[11px] text-ink-2">{total}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
