import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { cache } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { type TradeRange } from "@/lib/formatters";
import { getMonthDateRange } from "@/lib/dashboard/calendar-transforms";
import {
  ACCOUNTING_WINDOW_TOLERANCE_MS,
  applyAccountFlowAccountingToTrades,
  TRADING_ACCOUNTING_FLOW_TYPES,
} from "@/lib/dashboard/trade-accounting";

const getAccountedTrades = cache(async (exchangeId?: string) => {
  const where: Prisma.TradeWhereInput = {};

  if (exchangeId) {
    where.exchangeId = exchangeId;
  }

  const trades = await prisma.trade.findMany({
    where,
    include: {
      exchange: {
        select: { name: true },
      },
    },
    orderBy: { exitTime: "desc" },
  });

  return applyAccountFlowAccountingToTrades(
    trades,
    await getAccountingFlowsForTrades(trades)
  );
});

export async function getTradesInRange(range: TradeRange, exchangeId?: string) {
  const startDate = getRangeStartDate(range);
  const trades = await getAccountedTrades(exchangeId);
  return trades.filter((trade) => !startDate || trade.exitTime >= startDate);
}

export async function getTradesForMonth(
  month: string,
  exchangeId?: string
) {
  const { start, end } = getMonthDateRange(month);

  const trades = await getAccountedTrades(exchangeId);
  return trades.filter((trade) => trade.exitTime >= start && trade.exitTime < end)
    .sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime());
}

export function getRangeStartDate(range: TradeRange, now = new Date()): Date | undefined {
  switch (range) {
    case "7d":
      return startOfDay(subDays(now, 6));
    case "30d":
      return startOfDay(subDays(now, 29));
    case "90d":
      return startOfDay(subDays(now, 89));
    case "all":
      return undefined;
  }
}

export async function getAccountFlowsForCurve(exchangeId?: string) {
  const where: Prisma.AccountFlowWhereInput = {};

  if (exchangeId) {
    where.exchangeId = exchangeId;
  }

  return prisma.accountFlow.findMany({
    where,
    orderBy: { time: "asc" },
    select: {
      exchangeId: true,
      exchange: { select: { name: true, label: true } },
      type: true,
      asset: true,
      amount: true,
      time: true,
    },
  });
}

export async function hasAccountFlows(exchangeId?: string): Promise<boolean> {
  const where: Prisma.AccountFlowWhereInput = {};

  if (exchangeId) {
    where.exchangeId = exchangeId;
  }

  const flow = await prisma.accountFlow.findFirst({
    where,
    select: { id: true },
  });

  return !!flow;
}

export async function getExchanges() {
  return prisma.exchange.findMany({
    select: {
      id: true,
      name: true,
      label: true,
      isActive: true,
      _count: {
        select: {
          trades: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTodayPnl(exchangeId?: string): Promise<number> {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);
  const trades = await getAccountedTrades(exchangeId);
  return trades.filter((trade) => trade.exitTime >= start && trade.exitTime <= end)
    .reduce((sum, trade) => sum + trade.realizedPnl, 0);
}

async function getAccountingFlowsForTrades<T extends {
  exchangeId: string;
  symbol: string;
  entryTime: Date;
  exitTime: Date;
}>(trades: T[]) {
  if (trades.length === 0) return [];

  const exchangeIds = [...new Set(trades.map((trade) => trade.exchangeId))];
  const symbols = [...new Set(trades.map((trade) => trade.symbol))];
  const start = new Date(
    Math.min(...trades.map((trade) => trade.entryTime.getTime())) - ACCOUNTING_WINDOW_TOLERANCE_MS
  );
  const end = new Date(
    Math.max(...trades.map((trade) => trade.exitTime.getTime())) + ACCOUNTING_WINDOW_TOLERANCE_MS
  );

  return prisma.accountFlow.findMany({
    where: {
      exchangeId: { in: exchangeIds },
      symbol: { in: symbols },
      asset: "USDT",
      type: { in: [...TRADING_ACCOUNTING_FLOW_TYPES] },
      time: {
        gte: start,
        lte: end,
      },
    },
    select: {
      exchangeId: true,
      type: true,
      asset: true,
      amount: true,
      symbol: true,
      time: true,
    },
  });
}
