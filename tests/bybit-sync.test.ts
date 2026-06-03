import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCcxt = vi.hoisted(() => {
  const fetchMyTrades = vi.fn();
  const fetchPositionsHistory = vi.fn();
  const exchange = {
    fetchMyTrades,
    fetchPositionsHistory,
  };

  const bybit = vi.fn(function BybitMock() {
    return exchange;
  });

  return {
    fetchMyTrades,
    fetchPositionsHistory,
    exchange,
    bybit,
  };
});

vi.mock("ccxt", () => ({
  default: {
    bybit: mockCcxt.bybit,
  },
}));

import { fetchBybitTrades } from "@/lib/exchange/bybit";

describe("fetchBybitTrades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("imports Bybit closed-position history instead of fill-level executions", async () => {
    const since = new Date("2026-06-01T00:00:00Z");
    mockCcxt.fetchPositionsHistory.mockResolvedValue([
      {
        symbol: "ZEC/USDT:USDT",
        timestamp: new Date("2026-06-03T07:38:55.226Z").getTime(),
        lastUpdateTimestamp: new Date("2026-06-03T11:40:18.560Z").getTime(),
        side: "long",
        leverage: 10,
        entryPrice: 621.44,
        lastPrice: 591.97,
        contracts: 4.93,
        notional: 2918.4121,
        realizedPnl: -145.5879,
        info: {
          orderId: "close-order-1",
          symbol: "ZECUSDT",
          closedSize: "4.93",
          cumEntryValue: "3063.2992",
          cumExitValue: "2918.4121",
          createdTime: "1780000000000",
          updatedTime: "1780010000000",
          closedPnl: "-145.5879",
        },
      },
    ]);
    mockCcxt.fetchMyTrades.mockResolvedValue([
      {
        id: "entry-fill",
        symbol: "ZEC/USDT:USDT",
        timestamp: new Date("2026-06-03T07:38:55.226Z").getTime(),
        side: "buy",
        price: 621.44,
        amount: 4.93,
        takerOrMaker: "taker",
        fee: { cost: 1.68503456 },
        info: {
          execType: "Trade",
          orderId: "entry-order-1",
          closedSize: "0",
        },
      },
      {
        id: "exit-fill",
        symbol: "ZEC/USDT:USDT",
        timestamp: new Date("2026-06-03T11:40:18.560Z").getTime(),
        side: "sell",
        price: 591.97,
        amount: 4.93,
        takerOrMaker: "maker",
        fee: { cost: -0.22 },
        info: {
          execType: "Trade",
          orderId: "close-order-1",
          closedSize: "4.93",
        },
      },
    ]);

    const trades = await fetchBybitTrades(
      { apiKey: "key", apiSecret: "secret", exchange: "bybit" },
      since
    );

    expect(mockCcxt.fetchPositionsHistory).toHaveBeenCalledWith(
      undefined,
      since.getTime(),
      100,
      expect.objectContaining({
        subType: "linear",
        until: new Date("2026-06-04T00:00:00Z").getTime(),
      })
    );
    expect(mockCcxt.fetchMyTrades).toHaveBeenCalledWith(
      "ZEC/USDT:USDT",
      new Date("2026-06-03T07:33:55.226Z").getTime(),
      100,
      expect.objectContaining({
        category: "linear",
        type: "swap",
        until: new Date("2026-06-03T11:45:18.560Z").getTime(),
      })
    );
    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      externalId: "bybit_closed_pnl_ZECUSDT_close-order-1_1780010000000",
      symbol: "ZECUSDT",
      baseCoin: "ZEC",
      quoteCoin: "USDT",
      side: "Long",
      leverage: 10,
      marginMode: "cross",
      entryPrice: 621.44,
      entryQty: 4.93,
      entryValue: 3063.2992,
      exitPrice: 591.97,
      exitQty: 4.93,
      exitValue: 2918.4121,
      realizedPnl: -145.5879,
      fee: 1.46503456,
      makerFee: -0.22,
      takerFee: 1.68503456,
      fundingFee: 0,
    });
    expect(trades[0].entryTime.toISOString()).toBe("2026-06-03T07:38:55.226Z");
    expect(trades[0].exitTime.toISOString()).toBe("2026-06-03T11:40:18.560Z");
  });
});
