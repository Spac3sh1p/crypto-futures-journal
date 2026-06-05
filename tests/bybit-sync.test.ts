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

const BYBIT_MAX_HISTORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type MockExecutionFill = {
  id?: string;
  symbol?: string;
  timestamp?: number;
  side?: string;
  price?: number;
  amount?: number;
  takerOrMaker?: string;
  fee?: { cost?: number };
  info?: Record<string, unknown>;
};

function mockExecutionFillsByRequestWindow(fills: MockExecutionFill[]) {
  mockCcxt.fetchMyTrades.mockImplementation(
    async (_symbol: string, since?: number, _limit?: number, params?: Record<string, unknown>) => {
      const until = Number(params?.until);
      return fills.filter((fill) => {
        if (!fill.timestamp || !since || !Number.isFinite(until)) return false;
        return fill.timestamp >= since && fill.timestamp <= until;
      });
    }
  );
}

function expectBybitExecutionCallsWithinSevenDays() {
  expect(mockCcxt.fetchMyTrades).toHaveBeenCalled();

  for (const [symbol, since, limit, params] of mockCcxt.fetchMyTrades.mock.calls) {
    const until = Number((params as Record<string, unknown>)?.until);
    expect(symbol).toMatch(/\/USDT:USDT$/);
    expect(limit).toBe(100);
    expect(params).toEqual(
      expect.objectContaining({
        category: "linear",
        type: "swap",
      })
    );
    expect(until - Number(since)).toBeLessThanOrEqual(BYBIT_MAX_HISTORY_WINDOW_MS);
  }
}

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
    mockExecutionFillsByRequestWindow([
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
      expect.any(String),
      expect.any(Number),
      100,
      expect.any(Object)
    );
    expectBybitExecutionCallsWithinSevenDays();
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

  it("keeps Bybit entry details when the position opened before the incremental sync window", async () => {
    const since = new Date("2026-06-03T00:00:00Z");
    mockCcxt.fetchPositionsHistory.mockResolvedValue([
      {
        symbol: "HYPE/USDT:USDT",
        timestamp: new Date("2026-05-31T00:35:26.541Z").getTime(),
        lastUpdateTimestamp: new Date("2026-06-04T10:51:55.653Z").getTime(),
        side: "short",
        leverage: 5,
        entryPrice: 68.7218298,
        lastPrice: 64.9,
        contracts: 522.85,
        notional: 33932.965,
        realizedPnl: 1998.24370998,
        info: {
          orderId: "close-order-1",
          symbol: "HYPEUSDT",
          closedSize: "522.85",
          cumEntryValue: "35931.20871",
          cumExitValue: "33932.965",
          createdTime: "1780187726541",
          updatedTime: "1780531915653",
          closedPnl: "1998.24370998",
        },
      },
    ]);
    mockExecutionFillsByRequestWindow([
      {
        id: "exit-fill",
        symbol: "HYPE/USDT:USDT",
        timestamp: new Date("2026-06-04T10:51:55.653Z").getTime(),
        side: "buy",
        takerOrMaker: "maker",
        fee: { cost: 6.786593 },
        info: {
          execType: "Trade",
          orderId: "close-order-1",
          closedSize: "522.85",
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
    expect(trades).toHaveLength(1);
    expectBybitExecutionCallsWithinSevenDays();
    expect(trades[0]).toMatchObject({
      externalId: "bybit_closed_pnl_HYPEUSDT_close-order-1_1780531915653",
      symbol: "HYPEUSDT",
      side: "Short",
      entryQty: 522.85,
      exitQty: 522.85,
      realizedPnl: 1998.24370998,
      fee: 6.786593,
    });
    expect(trades[0].entryTime.toISOString()).toBe("2026-05-31T00:35:26.541Z");
    expect(trades[0].exitTime.toISOString()).toBe("2026-06-04T10:51:55.653Z");
  });

  it("derives Bybit entry time and total fees from executions when close-pnl timestamps point at the close", async () => {
    const since = new Date("2026-06-04T00:00:00Z");
    const openTime = new Date("2026-06-04T05:10:24.656Z").getTime();
    const closeTime = new Date("2026-06-04T05:24:19.513Z").getTime();
    mockCcxt.fetchPositionsHistory.mockResolvedValue([
      {
        symbol: "OPN/USDT:USDT",
        timestamp: closeTime - 3,
        lastUpdateTimestamp: closeTime,
        side: "long",
        leverage: 10,
        entryPrice: 0.20648114,
        lastPrice: 0.20523129,
        contracts: 6307,
        notional: 1294.3938,
        realizedPnl: -9.31086868,
        info: {
          orderId: "close-order-1",
          symbol: "OPNUSDT",
          side: "Sell",
          closedSize: "6307",
          openFee: "0.71625209",
          closeFee: "0.71191659",
          cumEntryValue: "1302.2765",
          cumExitValue: "1294.3938",
          createdTime: String(closeTime - 3),
          updatedTime: String(closeTime),
          closedPnl: "-9.31086868",
        },
      },
    ]);
    mockExecutionFillsByRequestWindow([
      {
        id: "open-fill",
        symbol: "OPN/USDT:USDT",
        timestamp: openTime,
        side: "buy",
        amount: 6307,
        takerOrMaker: "taker",
        fee: { cost: 0.71625209 },
        info: {
          execType: "Trade",
          orderId: "open-order-1",
          closedSize: "0",
          side: "Buy",
        },
      },
      {
        id: "close-fill",
        symbol: "OPN/USDT:USDT",
        timestamp: closeTime - 3,
        side: "sell",
        amount: 6307,
        takerOrMaker: "taker",
        fee: { cost: 0.71191659 },
        info: {
          execType: "Trade",
          orderId: "close-order-1",
          closedSize: "6307",
          side: "Sell",
        },
      },
    ]);

    const trades = await fetchBybitTrades(
      { apiKey: "key", apiSecret: "secret", exchange: "bybit" },
      since
    );

    expect(trades).toHaveLength(1);
    expectBybitExecutionCallsWithinSevenDays();
    expect(trades[0]).toMatchObject({
      externalId: "bybit_closed_pnl_OPNUSDT_close-order-1_1780550659513",
      symbol: "OPNUSDT",
      side: "Long",
      fee: 1.42816868,
      makerFee: 0,
      takerFee: 1.42816868,
    });
    expect(trades[0].entryTime.toISOString()).toBe("2026-06-04T05:10:24.656Z");
    expect(trades[0].exitTime.toISOString()).toBe("2026-06-04T05:24:19.513Z");
  });

  it("splits long Bybit execution lookbacks into seven-day API windows", async () => {
    const since = new Date("2026-06-04T00:00:00Z");
    const openTime = new Date("2026-05-15T03:00:00.000Z").getTime();
    const closeTime = new Date("2026-06-04T09:30:00.000Z").getTime();
    mockCcxt.fetchPositionsHistory.mockResolvedValue([
      {
        symbol: "BTC/USDT:USDT",
        timestamp: closeTime,
        lastUpdateTimestamp: closeTime,
        side: "long",
        leverage: 10,
        entryPrice: 100000,
        lastPrice: 101000,
        contracts: 0.1,
        notional: 10100,
        realizedPnl: 100,
        info: {
          orderId: "close-order-long-hold",
          symbol: "BTCUSDT",
          side: "Sell",
          closedSize: "0.1",
          cumEntryValue: "10000",
          cumExitValue: "10100",
          createdTime: String(closeTime),
          updatedTime: String(closeTime),
          closedPnl: "100",
        },
      },
    ]);
    mockExecutionFillsByRequestWindow([
      {
        id: "open-fill",
        symbol: "BTC/USDT:USDT",
        timestamp: openTime,
        side: "buy",
        amount: 0.1,
        takerOrMaker: "taker",
        fee: { cost: 5 },
        info: {
          execType: "Trade",
          orderId: "open-order-long-hold",
          closedSize: "0",
          side: "Buy",
        },
      },
      {
        id: "close-fill",
        symbol: "BTC/USDT:USDT",
        timestamp: closeTime,
        side: "sell",
        amount: 0.1,
        takerOrMaker: "taker",
        fee: { cost: 5.05 },
        info: {
          execType: "Trade",
          orderId: "close-order-long-hold",
          closedSize: "0.1",
          side: "Sell",
        },
      },
    ]);

    const trades = await fetchBybitTrades(
      { apiKey: "key", apiSecret: "secret", exchange: "bybit" },
      since
    );

    expectBybitExecutionCallsWithinSevenDays();
    expect(mockCcxt.fetchMyTrades.mock.calls.length).toBeGreaterThan(1);
    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      symbol: "BTCUSDT",
      fee: 10.05,
      takerFee: 10.05,
    });
    expect(trades[0].entryTime.toISOString()).toBe("2026-05-15T03:00:00.000Z");
    expect(trades[0].exitTime.toISOString()).toBe("2026-06-04T09:30:00.000Z");
  });
});
