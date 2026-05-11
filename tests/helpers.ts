import type { Trade } from "@/generated/prisma";

let counter = 0;

export function makeTrade(overrides: Partial<Trade> = {}): Trade {
  counter++;
  return {
    id: `trade-${counter}`,
    exchangeId: "ex-1",
    externalId: `ext-${counter}`,
    symbol: "BTCUSDT",
    baseCoin: "BTC",
    quoteCoin: "USDT",
    side: "Long",
    leverage: 10,
    marginMode: "cross",
    entryPrice: 50000,
    entryQty: 0.1,
    entryValue: 5000,
    entryTime: new Date("2024-01-15T10:00:00Z"),
    exitPrice: 51000,
    exitQty: 0.1,
    exitValue: 5100,
    exitTime: new Date("2024-01-15T12:00:00Z"),
    realizedPnl: 100,
    fee: 5,
    fundingFee: 0,
    pnlPercent: 2,
    holdDuration: 7200,
    isWin: true,
    tags: null,
    notes: null,
    rating: null,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T12:00:00Z"),
    ...overrides,
  };
}
