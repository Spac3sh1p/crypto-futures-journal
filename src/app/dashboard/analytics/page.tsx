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

interface PageProps {
  searchParams: Promise<{ range?: string; exchangeId?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = (params.range || "30d") as "7d" | "30d" | "90d" | "all";
  const exchangeId = params.exchangeId;

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
    <div className="space-y-6">
      {/* Section 1: Summary Cards */}
      <SummaryCards
        totalTrades={metrics.totalTrades}
        avgHold={metrics.avgHoldDuration}
        winRate={metrics.winRate}
        winCount={metrics.winCount}
        lossCount={metrics.lossCount}
        longCount={longsBreakdown.count}
        shortCount={shortsBreakdown.count}
      />

      {/* Section 2: Statistics Panel */}
      <StatisticsPanel stats={statistics} />

      {/* Section 3: Longs Breakdown */}
      <SideBreakdown data={longsBreakdown} />

      {/* Section 4: Shorts Breakdown */}
      <SideBreakdown data={shortsBreakdown} />

      {/* Section 5 & 6: Winning / Losing Trades */}
      <WinLossTable title="Winning Trades" rows={winningTrades} isWin={true} />
      <WinLossTable title="Losing Trades" rows={losingTrades} isWin={false} />

      {/* Section 7: Trade Result By Day + By Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeResultByDayChart data={resultByDay} />
        <TradeResultByTimeChart data={resultByTime} />
      </div>

      {/* Section 8: Duration Report + Size Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DurationReport data={durationReport} />
        <SizeReport data={sizeReport} />
      </div>

      {/* Section 9: Traded Symbols Report */}
      <SymbolsReport data={symbolsReport} />

      {/* Section 10: Funding + Fees */}
      <FundingFeesPanel funding={funding} fees={fees} />
    </div>
  );
}
