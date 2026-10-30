"use client";

import type { SideBreakdownData } from "@/lib/dashboard/analytics-transforms";
import { formatDuration, formatMoney } from "@/lib/formatters";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import { Panel, PanelHeader } from "@/components/v2/ui/Panel";
import { Meter, SideChip, SplitBar } from "@/components/v2/ui/Bars";

export function SideBreakdownV2({ data }: { data: SideBreakdownData }) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.analytics.side;
  const isLong = data.side === "Long";
  const sideLabel = isLong ? dictionary.common.long : dictionary.common.short;
  const tone = isLong ? "profit" : "loss";
  const empty = data.count === 0;

  return (
    <Panel>
      <PanelHeader
        size="sm"
        title={
          <span className="flex items-center gap-2">
            <SideChip side={data.side} long={dictionary.common.long} short={dictionary.common.short} />
            <span>{template(text.countTitle, { side: sideLabel })}</span>
          </span>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <div className="px-4 py-3">
          <div className="text-[12px] text-ink-3">{template(text.countTitle, { side: sideLabel })}</div>
          <div className="v2-figure mt-0.5 text-[18px] leading-6 text-ink">{data.count}</div>
          <div className="mt-1.5"><Meter value={data.percentage} tone={tone} height={4} /></div>
          <div className="mt-1 text-[11px] text-ink-3">{template(text.percentage, { percent: data.percentage.toFixed(0), side: sideLabel })}</div>
        </div>

        <div className="border-t border-line px-4 py-3 md:border-l md:border-t-0">
          <div className="text-[12px] text-ink-3">{template(text.winRatio, { side: sideLabel })}</div>
          <div className="v2-figure mt-0.5 text-[18px] leading-6 text-ink">{empty ? "--" : `${data.winRate.toFixed(1)}%`}</div>
          <div className="mt-1.5"><SplitBar a={data.winCount} b={data.lossCount} height={4} /></div>
          <div className="v2-num mt-1 text-[11px] text-ink-3">{template(text.winsLosses, { wins: data.winCount, losses: data.lossCount })}</div>
        </div>

        <div className="border-t border-line px-4 py-3 xl:border-l xl:border-t-0">
          <div className="text-[12px] text-ink-3">{template(text.avgDuration, { side: sideLabel })}</div>
          <div className="v2-figure mt-0.5 text-[18px] leading-6 text-ink">{empty ? "--" : formatDuration(data.avgDuration, locale)}</div>
          <div className="mt-1.5 space-y-1.5">
            <div>
              <div className="flex justify-between text-[11px] text-ink-3">
                <span>{text.winAbove}</span>
                <span className="v2-num">{data.winPercentAbove.toFixed(1)}%</span>
              </div>
              <div className="mt-0.5"><Meter value={data.winPercentAbove} tone="profit" height={3} /></div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-ink-3">
                <span>{text.winBelow}</span>
                <span className="v2-num">{data.winPercentBelow.toFixed(1)}%</span>
              </div>
              <div className="mt-0.5"><Meter value={data.winPercentBelow} tone="loss" height={3} /></div>
            </div>
          </div>
        </div>

        <div className="border-t border-line px-4 py-3 md:border-l xl:border-t-0">
          <div className="text-[12px] text-ink-3">{template(text.totalPnl, { side: sideLabel })}</div>
          <div className={`v2-figure mt-0.5 text-[18px] leading-6 ${empty ? "text-ink" : data.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>{empty ? "--" : formatMoney(data.totalPnl)}</div>
          <dl className="mt-1.5 space-y-0.5 text-[11px]">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">{text.avgWin}</dt>
              <dd className={`v2-num ${empty ? "text-ink-3" : "text-profit"}`}>{empty ? "--" : formatMoney(data.avgWin)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">{text.avgLoss}</dt>
              <dd className={`v2-num ${empty ? "text-ink-3" : "text-loss"}`}>{empty ? "--" : formatMoney(-Math.abs(data.avgLoss))}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Panel>
  );
}
