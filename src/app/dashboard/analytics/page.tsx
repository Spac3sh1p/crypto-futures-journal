import { normalizeDashboardParams } from "@/lib/dashboard/trade-history-routing";
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
import { formatDurationBucketLabel } from "@/lib/dashboard/analytics-labels";
import { getServerDictionary, getServerLocale } from "@/lib/i18n-server";
import { AccountingNotice } from "@/components/dashboard/AccountingNotice";
import { StatisticsPanel } from "@/components/analytics/StatisticsPanel";
import { SummaryStrip } from "@/components/analytics/SummaryStrip";
import { SideBreakdown } from "@/components/analytics/SideBreakdown";
import { WinLossTable } from "@/components/analytics/WinLossTable";
import { ResultBarChart } from "@/components/analytics/ResultBarChart";
import { BucketReport } from "@/components/analytics/BucketReport";
import { SymbolsReport } from "@/components/analytics/SymbolsReport";
import { FundingFeesPanel } from "@/components/analytics/FundingFeesPanel";

interface PageProps {
  searchParams: Promise<{ range?: string; exchangeId?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
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
  }));
  const pad2 = (hour: number) => String(hour).padStart(2, "0");
  const resultByTime = buildTradeResultByTime(trades).map((item, index) => {
    const start = index * 2;
    const end = start + 2;
    return {
      ...item,
      // 坐标轴用「0–2时」，提示框用「00:00–02:00」，与交易明细的开仓时段筛选一致
      display: locale === "zh" ? `${start}–${end}时` : `${start}–${end}h`,
      tooltipLabel: `${pad2(start)}:00–${pad2(end)}:00`,
    };
  });
  const durationReport = buildDurationReport(trades).map((bucket) => ({ ...bucket, label: formatDurationBucketLabel(bucket.label, locale) }));
  const sizeReport = buildSizeReport(trades);
  const symbolsReport = buildSymbolsReport(trades);
  const funding = buildFundingReport(trades);
  const fees = buildFeesReport(trades);

  return (
    <div className="space-y-3">
      <StatisticsPanel stats={statistics} />
      <SummaryStrip
        totalTrades={metrics.totalTrades}
        avgHold={metrics.avgHoldDuration}
        winRate={metrics.winRate}
        winCount={metrics.winCount}
        lossCount={metrics.lossCount}
        longCount={longs.count}
        shortCount={shorts.count}
      />
      <SideBreakdown data={longs} />
      <SideBreakdown data={shorts} />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <WinLossTable title={dictionary.analytics.winLossTable.winningTrades} rows={winningTrades} isWin />
        <WinLossTable title={dictionary.analytics.winLossTable.losingTrades} rows={losingTrades} isWin={false} />
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ResultBarChart title={dictionary.analytics.charts.resultByDay} hint={dictionary.analytics.charts.groupByOpen} data={resultByDay} />
        <ResultBarChart title={dictionary.analytics.charts.resultByTime} hint={dictionary.analytics.charts.groupByOpen} data={resultByTime} />
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <BucketReport title={dictionary.analytics.reports.durationTitle} subtitle={dictionary.analytics.reports.durationSubtitle} data={durationReport} />
        <BucketReport title={dictionary.analytics.reports.sizeTitle} subtitle={dictionary.analytics.reports.sizeSubtitle} data={sizeReport} />
      </div>
      <SymbolsReport key={`${range}-${exchangeId ?? "all"}`} data={symbolsReport} scope={scope} />
      <FundingFeesPanel funding={funding} fees={fees} />
      <AccountingNotice trades={trades} text={dictionary.accounting} />
    </div>
  );
}
