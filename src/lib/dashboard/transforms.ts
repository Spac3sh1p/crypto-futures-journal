import { Trade } from "@/generated/prisma/client";
import {
  groupTrades,
  calculateMetrics,
  GroupByDimension,
} from "@/lib/analysis";
import { format } from "date-fns";

export function buildCumulativePnlSeries(
  trades: Trade[]
): { date: string; value: number }[] {
  const sorted = [...trades].sort(
    (a, b) => a.exitTime.getTime() - b.exitTime.getTime()
  );

  let cumulative = 0;
  return sorted.map((trade) => {
    cumulative += trade.realizedPnl;
    return {
      date: format(trade.exitTime, "yyyy-MM-dd"),
      value: cumulative,
    };
  });
}

export function buildDailyPnlSeries(
  trades: Trade[]
): { date: string; pnl: number }[] {
  const dailyMap = new Map<string, number>();

  trades.forEach((trade) => {
    const date = format(trade.exitTime, "yyyy-MM-dd");
    const current = dailyMap.get(date) ?? 0;
    dailyMap.set(date, current + trade.realizedPnl);
  });

  return Array.from(dailyMap.entries())
    .map(([date, pnl]) => ({ date, pnl }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildDrawdownSeries(
  trades: Trade[]
): { date: string; drawdown: number }[] {
  const sorted = [...trades].sort(
    (a, b) => a.exitTime.getTime() - b.exitTime.getTime()
  );

  let cumulative = 0;
  let peak = 0;
  const series: { date: string; drawdown: number }[] = [];

  sorted.forEach((trade) => {
    cumulative += trade.realizedPnl;
    peak = Math.max(peak, cumulative);
    const drawdown = cumulative - peak;

    series.push({
      date: format(trade.exitTime, "yyyy-MM-dd"),
      drawdown,
    });
  });

  return series;
}

export function buildTradeCountSeries(
  trades: Trade[]
): { date: string; count: number }[] {
  const dailyMap = new Map<string, number>();

  trades.forEach((trade) => {
    const date = format(trade.exitTime, "yyyy-MM-dd");
    const current = dailyMap.get(date) ?? 0;
    dailyMap.set(date, current + 1);
  });

  return Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildGroupSummaries(
  trades: Trade[],
  dimension: GroupByDimension
): {
  name: string;
  tradeCount: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
}[] {
  const grouped = groupTrades(trades, dimension);

  const summaries = Object.entries(grouped).map(([name, groupedTrades]) => {
    const metrics = calculateMetrics(groupedTrades);
    return {
      name,
      tradeCount: metrics.totalTrades,
      winRate: metrics.winRate,
      totalPnl: metrics.totalPnl,
      avgPnl: metrics.expectancy,
    };
  });

  return summaries.sort((a, b) => b.totalPnl - a.totalPnl);
}
