"use client";

import { formatDuration } from "@/lib/formatters";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Panel } from "@/components/v2/ui/Panel";
import { SplitBar } from "@/components/v2/ui/Bars";

export function SummaryStripV2({
  totalTrades, avgHold, winRate, winCount, lossCount, longCount, shortCount,
}: {
  totalTrades: number;
  avgHold: number;
  winRate: number;
  winCount: number;
  lossCount: number;
  longCount: number;
  shortCount: number;
}) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.analytics.summary;
  const empty = totalTrades === 0;
  const longPct = totalTrades > 0 ? (longCount / totalTrades) * 100 : 0;
  const shortPct = totalTrades > 0 ? 100 - longPct : 0;

  return (
    <Panel>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        <div className="px-4 py-3">
          <div className="text-[12px] text-ink-3">{text.totalTrades}</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="v2-figure text-[16px] leading-6 text-ink">{totalTrades}</span>
            <span className="v2-num text-[12px] text-ink-3">{winCount}{dictionary.common.wins} / {lossCount}{dictionary.common.losses}</span>
          </div>
        </div>
        <div className="border-l border-line px-4 py-3">
          <div className="text-[12px] text-ink-3">{text.avgHold}</div>
          <div className="v2-figure mt-0.5 text-[16px] leading-6 text-ink">{empty ? "--" : formatDuration(avgHold, locale)}</div>
        </div>
        <div className="border-t border-line px-4 py-3 lg:border-l lg:border-t-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12px] text-ink-3">{text.winRate}</span>
            <span className="v2-figure text-[16px] leading-6 text-ink">{empty ? "--" : `${winRate.toFixed(0)}%`}</span>
          </div>
          <div className="mt-1.5">
            <SplitBar height={4} a={winCount} b={lossCount} label={`${winCount}${dictionary.common.wins} / ${lossCount}${dictionary.common.losses}`} />
          </div>
          <div className="v2-num mt-1 flex justify-between text-[11px] text-ink-3">
            <span>{winCount}{dictionary.common.wins}</span>
            <span>{lossCount}{dictionary.common.losses}</span>
          </div>
        </div>
        <div className="border-l border-t border-line px-4 py-3 lg:border-t-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12px] text-ink-3">{text.longShortRatio}</span>
            <span className="v2-num text-[13px] text-ink-2">{empty ? "--" : `${longPct.toFixed(0)}% / ${shortPct.toFixed(0)}%`}</span>
          </div>
          <div className="mt-1.5">
            <SplitBar height={4} a={longCount} b={shortCount} label={`${dictionary.common.long} ${longCount} / ${dictionary.common.short} ${shortCount}`} />
          </div>
          <div className="v2-num mt-1 flex justify-between text-[11px] text-ink-3">
            <span>{dictionary.common.long} {longCount}</span>
            <span>{dictionary.common.short} {shortCount}</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
