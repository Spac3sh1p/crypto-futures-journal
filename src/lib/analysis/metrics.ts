import type { Trade } from "@/generated/prisma";

export interface PerformanceMetrics {
  totalPnl: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  avgWin: number;
  avgLoss: number;
  maxWin: number;
  maxLoss: number;
  avgHoldDuration: number;
  avgLeverage: number;
  totalFees: number;
  netPnlAfterFees: number;
  expectancy: number; // avg $ per trade
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxDrawdown: number;
}

export function calculateMetrics(trades: Trade[]): PerformanceMetrics {
  if (trades.length === 0) {
    return {
      totalPnl: 0, winRate: 0, profitFactor: 0, totalTrades: 0,
      winCount: 0, lossCount: 0, avgWin: 0, avgLoss: 0,
      maxWin: 0, maxLoss: 0, avgHoldDuration: 0, avgLeverage: 0,
      totalFees: 0, netPnlAfterFees: 0, expectancy: 0,
      maxConsecutiveWins: 0, maxConsecutiveLosses: 0, maxDrawdown: 0,
    };
  }

  const wins = trades.filter((t) => t.isWin);
  const losses = trades.filter((t) => !t.isWin);

  const grossProfit = wins.reduce((sum, t) => sum + t.realizedPnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.realizedPnl, 0));
  const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);
  const chronologicalTrades = [...trades].sort(
    (a, b) => a.exitTime.getTime() - b.exitTime.getTime()
  );

  // Max consecutive wins/losses
  let maxConsecWins = 0, maxConsecLosses = 0;
  let currentWins = 0, currentLosses = 0;
  for (const t of chronologicalTrades) {
    if (t.isWin) {
      currentWins++;
      currentLosses = 0;
      maxConsecWins = Math.max(maxConsecWins, currentWins);
    } else {
      currentLosses++;
      currentWins = 0;
      maxConsecLosses = Math.max(maxConsecLosses, currentLosses);
    }
  }

  // Max drawdown (peak to trough in cumulative PnL)
  let peak = 0, maxDrawdown = 0, cumPnl = 0;
  for (const t of chronologicalTrades) {
    cumPnl += t.realizedPnl;
    peak = Math.max(peak, cumPnl);
    maxDrawdown = Math.max(maxDrawdown, peak - cumPnl);
  }

  const totalPnl = trades.reduce((sum, t) => sum + t.realizedPnl, 0);

  return {
    totalPnl,
    winRate: (wins.length / trades.length) * 100,
    profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
    totalTrades: trades.length,
    winCount: wins.length,
    lossCount: losses.length,
    avgWin: wins.length > 0 ? grossProfit / wins.length : 0,
    avgLoss: losses.length > 0 ? -(grossLoss / losses.length) : 0,
    maxWin: wins.length > 0 ? Math.max(...wins.map((t) => t.realizedPnl)) : 0,
    maxLoss: losses.length > 0 ? Math.min(...losses.map((t) => t.realizedPnl)) : 0,
    avgHoldDuration: trades.reduce((sum, t) => sum + t.holdDuration, 0) / trades.length,
    avgLeverage: trades.reduce((sum, t) => sum + t.leverage, 0) / trades.length,
    totalFees,
    netPnlAfterFees: totalPnl,
    expectancy: totalPnl / trades.length,
    maxConsecutiveWins: maxConsecWins,
    maxConsecutiveLosses: maxConsecLosses,
    maxDrawdown,
  };
}

// Group trades by various dimensions for CoinMarketMan-style analysis
export type GroupByDimension = "symbol" | "baseCoin" | "side" | "leverage" | "holdDuration" | "dayOfWeek" | "hour";

export function groupTrades(trades: Trade[], dimension: GroupByDimension): Record<string, Trade[]> {
  const groups: Record<string, Trade[]> = {};

  for (const trade of trades) {
    let key: string;

    switch (dimension) {
      case "symbol":
        key = trade.symbol;
        break;
      case "baseCoin":
        key = trade.baseCoin;
        break;
      case "side":
        key = trade.side;
        break;
      case "leverage":
        key = categorizeLeverage(trade.leverage);
        break;
      case "holdDuration":
        key = categorizeHoldDuration(trade.holdDuration);
        break;
      case "dayOfWeek":
        key = new Date(trade.entryTime).toLocaleDateString("en", { weekday: "long" });
        break;
      case "hour":
        key = `${new Date(trade.entryTime).getHours()}:00`;
        break;
      default:
        key = "other";
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(trade);
  }

  return groups;
}

function categorizeLeverage(leverage: number): string {
  if (leverage <= 3) return "1-3x";
  if (leverage <= 10) return "4-10x";
  if (leverage <= 25) return "11-25x";
  if (leverage <= 50) return "26-50x";
  return "50x+";
}

function categorizeHoldDuration(seconds: number): string {
  const minutes = seconds / 60;
  if (minutes < 5) return "Scalp (<5m)";
  if (minutes < 60) return "Short (5m-1h)";
  if (minutes < 240) return "Medium (1-4h)";
  if (minutes < 1440) return "Swing (4-24h)";
  return "Position (>24h)";
}
