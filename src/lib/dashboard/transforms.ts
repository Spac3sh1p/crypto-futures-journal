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

  const dailyPnl = new Map<string, number>();
  sorted.forEach((trade) => {
    const date = format(trade.exitTime, "yyyy-MM-dd");
    dailyPnl.set(date, (dailyPnl.get(date) ?? 0) + trade.realizedPnl);
  });

  let cumulative = 0;
  return Array.from(dailyPnl.entries()).map(([date, pnl]) => {
    cumulative += pnl;
    return {
      date,
      value: cumulative,
    };
  });
}

export interface AccountFlowLike {
  type: string;
  asset: string;
  amount: number;
  time: Date;
}

export interface AccountFlowPnlPoint {
  date: string;
  value: number;
  returnPct: number;
  netDeposits: number;
}

const TRADING_FLOW_TYPES = new Set(["REALIZED_PNL", "COMMISSION", "FUNDING_FEE"]);

export function buildAccountFlowPnlSeries(
  flows: AccountFlowLike[],
  visibleStart?: Date
): AccountFlowPnlPoint[] {
  const sorted = [...flows]
    .filter((flow) => flow.asset === "USDT")
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  const daily = new Map<string, { tradingPnl: number; transfer: number }>();
  for (const flow of sorted) {
    const date = format(flow.time, "yyyy-MM-dd");
    const bucket = daily.get(date) ?? { tradingPnl: 0, transfer: 0 };

    if (flow.type === "TRANSFER") {
      bucket.transfer += flow.amount;
    } else if (TRADING_FLOW_TYPES.has(flow.type)) {
      bucket.tradingPnl += flow.amount;
    }

    daily.set(date, bucket);
  }

  let cumulativeTradingPnl = 0;
  let netDeposits = 0;
  const startDate = visibleStart ? format(visibleStart, "yyyy-MM-dd") : null;
  const points: AccountFlowPnlPoint[] = [];

  for (const [date, bucket] of Array.from(daily.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    netDeposits += bucket.transfer;
    cumulativeTradingPnl += bucket.tradingPnl;

    if (startDate && date < startDate) {
      continue;
    }

    points.push({
      date,
      value: cumulativeTradingPnl,
      returnPct: netDeposits > 0 ? (cumulativeTradingPnl / netDeposits) * 100 : 0,
      netDeposits,
    });
  }

  return points;
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
