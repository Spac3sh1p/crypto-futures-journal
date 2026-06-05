import { Trade } from "@/generated/prisma/client";
import { format } from "date-fns";

export interface Statistics {
  totalGainLoss: number;
  tradeExpectancy: number;
  avgDailyGain: number;
  avgDailyVolume: number;
  largestGain: number;
  totalTradesVolume: number;
  avgTradesPerDay: number;
  avgTradeWin: number;
  avgTradeLoss: number;
  maxConsecutiveWin: number;
  maxConsecutiveLoss: number;
  largestLoss: number;
  tradingDays: number;
}

export interface SideBreakdownData {
  side: "Long" | "Short";
  count: number;
  percentage: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgDuration: number;
  winPercentAbove: number;
  winPercentBelow: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
}

export interface WinLossRow {
  type: string;
  count: number;
  avgDuration: number;
  avgSize: number;
  avgGainLoss: number;
}

export interface DayTimeBar {
  label: string;
  pnl: number;
}

export interface DurationSizeBucket {
  label: string;
  wins: number;
  losses: number;
}

export interface SymbolReport {
  symbol: string;
  tradeCount: number;
  winRate: number;
  longPercent: number;
  shortPercent: number;
  avgDuration: number;
  avgGain: number;
  totalGain: number;
}

export interface SymbolTop10Report {
  rank: number;
  symbol: string;
  netPnl: number;
  returnPct: number | null;
  winRate: number;
  tradeCount: number;
  totalEntryValue: number;
}

export interface FundingReport {
  received: number;
  paid: number;
  net: number;
}

export interface FeesReport {
  makerRebates: number;
  marketFeesPaid: number;
  net: number;
}

export function buildStatistics(trades: Trade[]): Statistics {
  if (trades.length === 0) {
    return {
      totalGainLoss: 0, tradeExpectancy: 0, avgDailyGain: 0, avgDailyVolume: 0,
      largestGain: 0, totalTradesVolume: 0, avgTradesPerDay: 0, avgTradeWin: 0,
      avgTradeLoss: 0, maxConsecutiveWin: 0, maxConsecutiveLoss: 0, largestLoss: 0,
      tradingDays: 0,
    };
  }

  const wins = trades.filter((t) => t.isWin);
  const losses = trades.filter((t) => !t.isWin);
  const totalPnl = trades.reduce((s, t) => s + t.realizedPnl, 0);
  const totalVolume = trades.reduce((s, t) => s + t.entryValue, 0);

  const daySet = new Set(trades.map((t) => format(t.exitTime, "yyyy-MM-dd")));
  const tradingDays = daySet.size || 1;

  let maxConsecWin = 0, maxConsecLoss = 0, curWin = 0, curLoss = 0;
  const sorted = [...trades].sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime());
  for (const t of sorted) {
    if (t.isWin) { curWin++; curLoss = 0; maxConsecWin = Math.max(maxConsecWin, curWin); }
    else { curLoss++; curWin = 0; maxConsecLoss = Math.max(maxConsecLoss, curLoss); }
  }

  return {
    totalGainLoss: totalPnl,
    tradeExpectancy: totalPnl / trades.length,
    avgDailyGain: totalPnl / tradingDays,
    avgDailyVolume: totalVolume / tradingDays,
    largestGain: wins.length > 0 ? Math.max(...wins.map((t) => t.realizedPnl)) : 0,
    totalTradesVolume: totalVolume,
    avgTradesPerDay: trades.length / tradingDays,
    avgTradeWin: wins.length > 0 ? wins.reduce((s, t) => s + t.realizedPnl, 0) / wins.length : 0,
    avgTradeLoss: losses.length > 0 ? losses.reduce((s, t) => s + t.realizedPnl, 0) / losses.length : 0,
    maxConsecutiveWin: maxConsecWin,
    maxConsecutiveLoss: maxConsecLoss,
    largestLoss: losses.length > 0 ? Math.min(...losses.map((t) => t.realizedPnl)) : 0,
    tradingDays,
  };
}

export function buildSideBreakdown(trades: Trade[], side: "Long" | "Short"): SideBreakdownData {
  const sideTrades = trades.filter((t) => t.side === side);
  const wins = sideTrades.filter((t) => t.isWin);
  const losses = sideTrades.filter((t) => !t.isWin);
  const totalDuration = sideTrades.reduce((s, t) => s + t.holdDuration, 0);

  const winsAbove = wins.filter((t) => t.holdDuration < (totalDuration / sideTrades.length)).length;
  const winsBelowOrEqual = wins.length - winsAbove;

  return {
    side,
    count: sideTrades.length,
    percentage: trades.length > 0 ? (sideTrades.length / trades.length) * 100 : 0,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: sideTrades.length > 0 ? (wins.length / sideTrades.length) * 100 : 0,
    avgDuration: sideTrades.length > 0 ? totalDuration / sideTrades.length : 0,
    winPercentAbove: sideTrades.length > 0 ? (winsAbove / sideTrades.length) * 100 : 0,
    winPercentBelow: sideTrades.length > 0 ? (winsBelowOrEqual / sideTrades.length) * 100 : 0,
    totalPnl: sideTrades.reduce((s, t) => s + t.realizedPnl, 0),
    avgWin: wins.length > 0 ? wins.reduce((s, t) => s + t.realizedPnl, 0) / wins.length : 0,
    avgLoss: losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.realizedPnl, 0) / losses.length) : 0,
  };
}

export function buildWinLossTable(trades: Trade[], isWin: boolean): WinLossRow[] {
  const filtered = trades.filter((t) => t.isWin === isWin);
  const longs = filtered.filter((t) => t.side === "Long");
  const shorts = filtered.filter((t) => t.side === "Short");

  const buildRow = (label: string, arr: Trade[]): WinLossRow => ({
    type: label,
    count: arr.length,
    avgDuration: arr.length > 0 ? arr.reduce((s, t) => s + t.holdDuration, 0) / arr.length : 0,
    avgSize: arr.length > 0 ? arr.reduce((s, t) => s + t.entryValue, 0) / arr.length : 0,
    avgGainLoss: arr.length > 0 ? arr.reduce((s, t) => s + t.realizedPnl, 0) / arr.length : 0,
  });

  return [buildRow("Long", longs), buildRow("Short", shorts), buildRow("Both", filtered)];
}

export function buildTradeResultByDay(trades: Trade[]): DayTimeBar[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const map = new Map<number, number>();
  trades.forEach((t) => {
    const dow = t.entryTime.getDay();
    const adjusted = dow === 0 ? 6 : dow - 1;
    map.set(adjusted, (map.get(adjusted) ?? 0) + t.realizedPnl);
  });
  return days.map((label, i) => ({ label, pnl: map.get(i) ?? 0 }));
}

export function buildTradeResultByTime(trades: Trade[]): DayTimeBar[] {
  const slots: DayTimeBar[] = [];
  for (let h = 0; h < 24; h += 2) {
    slots.push({ label: `${String(h).padStart(2, "0")}-${String(h + 2).padStart(2, "0")}`, pnl: 0 });
  }
  trades.forEach((t) => {
    const hour = t.entryTime.getHours();
    const idx = Math.floor(hour / 2);
    slots[idx].pnl += t.realizedPnl;
  });
  return slots;
}

export function buildDurationReport(trades: Trade[]): DurationSizeBucket[] {
  const buckets: { label: string; min: number; max: number }[] = [
    { label: "> 0s 0d 0h 1m", min: 0, max: 60 },
    { label: "> 0d 1h 55m", min: 60, max: 6900 },
    { label: "> 0d 3h 49m", min: 6900, max: 13740 },
    { label: "> 0d 5h 43m", min: 13740, max: 20580 },
    { label: "> 0d 7h 37m", min: 20580, max: Infinity },
  ];

  return buckets.map((b) => {
    const inBucket = trades.filter((t) => t.holdDuration >= b.min && t.holdDuration < b.max);
    return {
      label: b.label,
      wins: inBucket.filter((t) => t.isWin).length,
      losses: inBucket.filter((t) => !t.isWin).length,
    };
  });
}

export function buildSizeReport(trades: Trade[]): DurationSizeBucket[] {
  const values = trades.map((t) => t.entryValue).sort((a, b) => a - b);
  if (values.length === 0) return [];

  const min = values[0];
  const max = values[values.length - 1];
  const range = max - min;
  const step = range / 4 || 1;

  const buckets: { label: string; min: number; max: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const lo = min + step * i;
    const hi = i === 3 ? Infinity : min + step * (i + 1);
    buckets.push({ label: `> ${Math.round(lo).toLocaleString()}`, min: lo, max: hi });
  }

  return buckets.map((b) => {
    const inBucket = trades.filter((t) => t.entryValue >= b.min && t.entryValue < b.max);
    return {
      label: b.label,
      wins: inBucket.filter((t) => t.isWin).length,
      losses: inBucket.filter((t) => !t.isWin).length,
    };
  });
}

export function buildSymbolsReport(trades: Trade[]): SymbolReport[] {
  const grouped = new Map<string, Trade[]>();
  trades.forEach((t) => {
    if (!grouped.has(t.symbol)) grouped.set(t.symbol, []);
    grouped.get(t.symbol)!.push(t);
  });

  const reports: SymbolReport[] = [];
  grouped.forEach((arr, symbol) => {
    const wins = arr.filter((t) => t.isWin);
    const longs = arr.filter((t) => t.side === "Long");
    const totalPnl = arr.reduce((s, t) => s + t.realizedPnl, 0);
    const avgDuration = arr.reduce((s, t) => s + t.holdDuration, 0) / arr.length;

    reports.push({
      symbol,
      tradeCount: arr.length,
      winRate: (wins.length / arr.length) * 100,
      longPercent: (longs.length / arr.length) * 100,
      shortPercent: ((arr.length - longs.length) / arr.length) * 100,
      avgDuration,
      avgGain: totalPnl / arr.length,
      totalGain: totalPnl,
    });
  });

  return reports.sort((a, b) => {
    if (b.totalGain !== a.totalGain) return b.totalGain - a.totalGain;
    return a.symbol.localeCompare(b.symbol);
  });
}

export function buildSymbolTop10Report(trades: Trade[]): SymbolTop10Report[] {
  const grouped = new Map<string, Trade[]>();
  trades.forEach((trade) => {
    if (!grouped.has(trade.symbol)) grouped.set(trade.symbol, []);
    grouped.get(trade.symbol)!.push(trade);
  });

  const reports = Array.from(grouped.entries()).map(([symbol, arr]) => {
    const wins = arr.filter((trade) => trade.isWin).length;
    const netPnl = arr.reduce((sum, trade) => sum + trade.realizedPnl, 0);
    const totalEntryValue = arr.reduce((sum, trade) => sum + Math.abs(trade.entryValue), 0);
    const returnPct = totalEntryValue > 0 ? (netPnl / totalEntryValue) * 100 : null;

    return {
      rank: 0,
      symbol,
      netPnl,
      returnPct,
      winRate: (wins / arr.length) * 100,
      tradeCount: arr.length,
      totalEntryValue,
    };
  });

  return reports
    .sort((a, b) => {
      if (a.returnPct === null && b.returnPct === null) return a.symbol.localeCompare(b.symbol);
      if (a.returnPct === null) return 1;
      if (b.returnPct === null) return -1;
      if (b.returnPct !== a.returnPct) return b.returnPct - a.returnPct;
      if (b.netPnl !== a.netPnl) return b.netPnl - a.netPnl;
      return a.symbol.localeCompare(b.symbol);
    })
    .slice(0, 10)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function buildFundingReport(trades: Trade[]): FundingReport {
  let received = 0, paid = 0;
  trades.forEach((t) => {
    if (t.fundingFee >= 0) received += t.fundingFee;
    else paid += t.fundingFee;
  });
  return { received, paid: Math.abs(paid), net: received - Math.abs(paid) };
}

export function buildFeesReport(trades: Trade[]): FeesReport {
  const makerRebates = trades.reduce((s, t) => s + Math.abs(Math.min(t.makerFee, 0)), 0);
  const marketFeesPaid = trades.reduce(
    (s, t) => s + Math.max(t.makerFee, 0) + Math.max(t.takerFee, 0),
    0
  );
  const net = makerRebates - marketFeesPaid;
  return { makerRebates, marketFeesPaid, net };
}
