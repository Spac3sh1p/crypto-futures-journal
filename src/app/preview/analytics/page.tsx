import { normalizeDashboardParams } from "@/lib/dashboard/trade-history-routing";
import { buildTradeHistoryHref } from "@/lib/dashboard/trade-history-routing";
import { toPreviewHref } from "@/lib/dashboard/preview-routing";
import { parseRange } from "@/lib/formatters";
import { getTradesInRange } from "@/lib/dashboard/queries";
import { calculateMetrics } from "@/lib/analysis";
import {
  buildStatistics,
  buildSideBreakdown,
  buildWinLossTable,
  buildTradeResultByDay,
  buildTradeResultByTime,
  buildDurationReport,
  buildSizeReport,
  buildSymbolsReport,
  buildFundingReport,
  buildFeesReport,
} from "@/lib/dashboard/analytics-transforms";
import { getServerDictionary, getServerLocale } from "@/lib/i18n-server";
import { formatDurationBucketLabel } from "@/lib/dashboard/analytics-labels";
import { AccountingNoticeV2 } from "@/components/v2/AccountingNoticeV2";
import { StatisticsV2 } from "@/components/v2/analytics/StatisticsV2";
import { SummaryStripV2 } from "@/components/v2/analytics/SummaryStripV2";
import { SideBreakdownV2 } from "@/components/v2/analytics/SideBreakdownV2";
import { WinLossTableV2 } from "@/components/v2/analytics/WinLossTableV2";
import { ResultBarChartV2 } from "@/components/v2/analytics/ResultBarChartV2";
import { BucketReportV2 } from "@/components/v2/analytics/BucketReportV2";
import { SymbolsReportV2 } from "@/components/v2/analytics/SymbolsReportV2";
import { FundingFeesV2 } from "@/components/v2/analytics/FundingFeesV2";

interface PageProps {
  searchParams: Promise<{ range?: string; exchangeId?: string }>;
}

export default async function PreviewAnalyticsPage({ searchParams }: PageProps) {
  const params = normalizeDashboardParams(await searchParams);
  const range = parseRange(params.range);
  const exchangeId = params.exchangeId;
  const dictionary = await getServerDictionary();
  const locale = await getServerLocale();
  const scope = { range, exchangeId };

  const trades = await getTradesInRange(range, exchangeId);
  const metrics = calculateMetrics(trades);
  const statistics = buildStatistics(trades);
  const longs = buildSideBreakdown(trades, "Long");
  const shorts = buildSideBreakdown(trades, "Short");
  const winningTrades = buildWinLossTable(trades, true);
  const losingTrades = buildWinLossTable(trades, false);
  const resultByDay = buildTradeResultByDay(trades).map((item) => ({
    ...item,
    display: dictionary.analytics.days[item.label as keyof typeof dictionary.analytics.days] ?? item.label,
    href: toPreviewHref(buildTradeHistoryHref({ ...scope, entryDay: item.label })),
  }));
  const resultByTime = buildTradeResultByTime(trades).map((item, index) => ({
    ...item,
    href: toPreviewHref(buildTradeHistoryHref({ ...scope, entrySlot: String(index * 2) })),
  }));
  const durationReport = buildDurationReport(trades);
  const sizeReport = buildSizeReport(trades);
  const symbolsReport = buildSymbolsReport(trades);
  const funding = buildFundingReport(trades);
  const fees = buildFeesReport(trades);
  const durationReportDisplay = durationReport.map((bucket) => ({ ...bucket, label: formatDurationBucketLabel(bucket.label, locale) }));

  return (
    <div className="space-y-3">
      <StatisticsV2 stats={statistics} />
      <SummaryStripV2
        totalTrades={metrics.totalTrades}
        avgHold={metrics.avgHoldDuration}
        winRate={metrics.winRate}
        winCount={metrics.winCount}
        lossCount={metrics.lossCount}
        longCount={longs.count}
        shortCount={shorts.count}
      />
      <SideBreakdownV2 data={longs} />
      <SideBreakdownV2 data={shorts} />
      <div className="grid grid-cols-1 gap-3 min-[1280px]:grid-cols-2">
        <WinLossTableV2 title={dictionary.analytics.winLossTable.winningTrades} rows={winningTrades} isWin />
        <WinLossTableV2 title={dictionary.analytics.winLossTable.losingTrades} rows={losingTrades} isWin={false} />
      </div>
      <div className="grid grid-cols-1 gap-3 min-[1280px]:grid-cols-2">
        <ResultBarChartV2 title={dictionary.analytics.charts.resultByDay} hint={dictionary.analytics.charts.groupByOpen} data={resultByDay} />
        <ResultBarChartV2 title={dictionary.analytics.charts.resultByTime} hint={dictionary.analytics.charts.groupByOpen} data={resultByTime} />
      </div>
      <div className="grid grid-cols-1 gap-3 min-[1280px]:grid-cols-2">
        <BucketReportV2
          title={dictionary.analytics.reports.durationTitle}
          subtitle={dictionary.analytics.reports.durationSubtitle}
          data={durationReportDisplay}
        />
        <BucketReportV2
          title={dictionary.analytics.reports.sizeTitle}
          subtitle={dictionary.analytics.reports.sizeSubtitle}
          data={sizeReport}
        />
      </div>
      <SymbolsReportV2 key={`${range}-${exchangeId ?? "all"}`} data={symbolsReport} scope={scope} />
      <FundingFeesV2 funding={funding} fees={fees} />
      <AccountingNoticeV2 trades={trades} text={dictionary.accounting} />
    </div>
  );
}
