import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const prisma = {
    exchange: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    accountFlow: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    syncLog: {
      create: vi.fn(),
      update: vi.fn(),
    },
    trade: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return {
    prisma,
    decryptSecret: vi.fn(),
    requireAuth: vi.fn(),
    fetchBybitTrades: vi.fn(),
    fetchBinanceTrades: vi.fn(),
    fetchBinanceAccountFlows: vi.fn(),
    fetchHyperliquidTrades: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/crypto", () => ({
  decryptSecret: mocks.decryptSecret,
}));

vi.mock("@/lib/exchange", () => ({
  fetchBybitTrades: mocks.fetchBybitTrades,
  fetchBinanceTrades: mocks.fetchBinanceTrades,
  fetchBinanceAccountFlows: mocks.fetchBinanceAccountFlows,
  fetchHyperliquidTrades: mocks.fetchHyperliquidTrades,
}));

import { POST } from "@/app/api/exchanges/[id]/sync/route";
import type { RawTrade } from "@/lib/exchange";

function makeRawTrade(overrides: Partial<RawTrade> = {}): RawTrade {
  const entryTime = new Date("2026-06-03T07:40:01.845Z");
  const exitTime = new Date("2026-06-03T11:40:18.566Z");

  return {
    externalId: "bybit-closed-position-1",
    symbol: "ZECUSDT",
    baseCoin: "ZEC",
    quoteCoin: "USDT",
    side: "Long",
    leverage: 10,
    marginMode: "cross",
    entryPrice: 621.44,
    entryQty: 4.93,
    entryValue: 3063.2992,
    entryTime,
    exitPrice: 591.97,
    exitQty: 4.93,
    exitValue: 2918.4121,
    exitTime,
    realizedPnl: -148.82855227,
    fee: 3.29016122,
    makerFee: 0,
    takerFee: 3.29016122,
    fundingFee: 0,
    ...overrides,
  };
}

describe("POST /api/exchanges/[id]/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue(null);
    mocks.decryptSecret.mockReturnValue("api-secret");
    mocks.prisma.exchange.findUnique.mockResolvedValue({
      id: "exchange-1",
      name: "bybit",
      apiKey: "api-key",
      apiSecret: "encrypted-secret",
      isActive: true,
      lastSync: new Date("2026-06-03T00:00:00Z"),
    });
    mocks.prisma.exchange.update.mockResolvedValue({});
    mocks.prisma.accountFlow.count.mockResolvedValue(0);
    mocks.prisma.accountFlow.findMany.mockResolvedValue([]);
    mocks.prisma.syncLog.create.mockResolvedValue({ id: "sync-log-1" });
    mocks.prisma.syncLog.update.mockResolvedValue({});
    mocks.prisma.trade.create.mockResolvedValue({});
    mocks.prisma.trade.update.mockResolvedValue({});
    mocks.prisma.$transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations)
    );
  });

  it("refreshes Bybit fees on existing synced trades instead of leaving stale zero fees", async () => {
    mocks.prisma.trade.findMany.mockResolvedValue([
      {
        id: "trade-1",
        externalId: "bybit-closed-position-1",
        fee: 0,
        makerFee: 0,
        takerFee: 0,
      },
    ]);
    mocks.fetchBybitTrades.mockResolvedValue([makeRawTrade()]);

    const response = await POST(new Request("http://localhost/api/exchanges/exchange-1/sync"), {
      params: Promise.resolve({ id: "exchange-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.tradesAdded).toBe(0);
    expect(body.data.tradesUpdated).toBe(1);
    expect(mocks.prisma.trade.create).not.toHaveBeenCalled();
    expect(mocks.prisma.trade.update).toHaveBeenCalledWith({
      where: { id: "trade-1" },
      data: {
        fee: 3.29016122,
        makerFee: 0,
        takerFee: 3.29016122,
      },
    });
    expect(mocks.prisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message: expect.stringContaining("Updated 1 existing trade"),
        }),
      })
    );
  });
});
