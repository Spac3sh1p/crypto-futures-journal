import { prisma } from "@/lib/prisma";
import { Trade } from "@/generated/prisma/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export async function getTradesInRange(
  range: "7d" | "30d" | "90d" | "all",
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

  const where: any = {};

  if (startDate) {
    where.exitTime = {
      gte: startDate,
    };
  }

  if (exchangeId) {
    where.exchangeId = exchangeId;
  }

  return prisma.trade.findMany({
    where,
    orderBy: {
      exitTime: "desc",
    },
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
    orderBy: {
      name: "asc",
    },
  });
}

export async function getTodayPnl(exchangeId?: string): Promise<number> {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  const where: any = {
    exitTime: {
      gte: startOfToday,
      lte: endOfToday,
    },
  };

  if (exchangeId) {
    where.exchangeId = exchangeId;
  }

  const result = await prisma.trade.aggregate({
    where,
    _sum: {
      realizedPnl: true,
    },
  });

  return result._sum.realizedPnl ?? 0;
}
