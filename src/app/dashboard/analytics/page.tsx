import { normalizeDashboardParams } from "@/lib/dashboard/trade-history-routing";
import { AccountingNotice } from "@/components/dashboard/AccountingNotice";
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
import { SummaryCards } from "@/components/analytics/SummaryCards";
import { StatisticsPanel } from "@/components/analytics/StatisticsPanel";
import { SideBreakdown } from "@/components/analytics/SideBreakdown";
import { WinLossTable } from "@/components/analytics/WinLossTable";
import { TradeResultByDayChart } from "@/components/analytics/TradeResultByDayChart";
import { TradeResultByTimeChart } from "@/components/analytics/TradeResultByTimeChart";
import { DurationReport } from "@/components/analytics/DurationReport";
import { SizeReport } from "@/components/analytics/SizeReport";
import { SymbolsReport } from "@/components/analytics/SymbolsReport";
import { FundingFeesPanel } from "@/components/analytics/FundingFeesPanel";
import { getServerDictionary } from "@/lib/i18n-server";

interface PageProps {
  searchParams: Promise<{ range?: string; exchangeId?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = normalizeDashboardParams(await searchParams);
  const range = parseRange(params.range);
  const exchangeId = params.exchangeId;
  const dictionary = await getServerDictionary();

  const trades = await getTradesInRange(range, exchangeId);
  const metrics = calculateMetrics(trades);

  const statistics = buildStatistics(trades);
  const longsBreakdown = buildSideBreakdown(trades, "Long");
  const shortsBreakdown = buildSideBreakdown(trades, "Short");
  const winningTrades = buildWinLossTable(trades, true);
  const losingTrades = buildWinLossTable(trades, false);
  const resultByDay = buildTradeResultByDay(trades);
  const resultByTime = buildTradeResultByTime(trades);
  const durationReport = buildDurationReport(trades);
  const sizeReport = buildSizeReport(trades);
  const symbolsReport = buildSymbolsReport(trades);
  const funding = buildFundingReport(trades);
  const fees = buildFeesReport(trades);

  return (
    <div className="space-y-4">
      <AccountingNotice trades={trades} text={dictionary.accounting} />
      {/* Section 1: Statistics Panel */}
      <StatisticsPanel stats={statistics} />

      {/* Section 2: Summary Strip */}
      <SummaryCards
        totalTrades={metrics.totalTrades}
        avgHold={metrics.avgHoldDuration}
        winRate={metrics.winRate}
        winCount={metrics.winCount}
        lossCount={metrics.lossCount}
        longCount={longsBreakdown.count}
        shortCount={shortsBreakdown.count}
      />

      {/* Section 3: Longs Breakdown */}
      <SideBreakdown data={longsBreakdown} />

      {/* Section 4: Shorts Breakdown */}
      <SideBreakdown data={shortsBreakdown} />

      {/* Section 5 & 6: Winning / Losing Trades */}
      <WinLossTable title={dictionary.analytics.winLossTable.winningTrades} rows={winningTrades} isWin={true} />
      <WinLossTable title={dictionary.analytics.winLossTable.losingTrades} rows={losingTrades} isWin={false} />

      {/* Section 7: Trade Result By Day + By Time */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TradeResultByDayChart data={resultByDay} scope={{ range, exchangeId }} />
        <TradeResultByTimeChart data={resultByTime} scope={{ range, exchangeId }} />
      </div>

      {/* Section 8: Duration Report + Size Report */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DurationReport data={durationReport} />
        <SizeReport data={sizeReport} />
      </div>

      {/* Section 9: Traded Symbols Report */}
      <SymbolsReport key={`${range}-${exchangeId ?? "all"}`} data={symbolsReport} scope={{ range, exchangeId }} />

      {/* Section 10: Funding + Fees */}
      <FundingFeesPanel funding={funding} fees={fees} />
    </div>
  );
}
