import { prisma } from "@/lib/prisma";
import { Trade, Prisma } from "@/generated/prisma/client";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { type TradeRange } from "@/lib/formatters";

export async function getTradesInRange(
  range: TradeRange,
  exchangeId?: string
): Promise<Trade[]> {
  const now = new Date();
  let startDate: Date | undefined;

  switch (range) {
    case "7d":
      startDate = startOfDay(subDays(now, 7));
      break;
    case "30d":
      startDate = startOfDay(subDays(now, 30));
      break;
    case "90d":
      startDate = startOfDay(subDays(now, 90));
      break;
    case "all":
      startDate = undefined;
      break;
  }

  const where: Prisma.TradeWhereInput = {};

  if (startDate) {
    where.exitTime = { gte: startDate };
  }

  if (exchangeId) {
    where.exchangeId = exchangeId;
  }

  return prisma.trade.findMany({
    where,
    orderBy: { exitTime: "desc" },
  });
}

export async function getExchanges() {
  return prisma.exchange.findMany({
    select: {
      id: true,
      name: true,
      label: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getTodayPnl(exchangeId?: string): Promise<number> {
  const today = new Date();

  const where: Prisma.TradeWhereInput = {
    exitTime: {
      gte: startOfDay(today),
      lte: endOfDay(today),
    },
  };

  if (exchangeId) {
    where.exchangeId = exchangeId;
  }

  const result = await prisma.trade.aggregate({
    where,
    _sum: { realizedPnl: true },
  });

  return result._sum.realizedPnl ?? 0;
}
