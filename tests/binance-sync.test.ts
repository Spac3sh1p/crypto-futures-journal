import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCcxt = vi.hoisted(() => {
  const loadMarkets = vi.fn();
  const fapiPrivateGetIncome = vi.fn();
  const fetchMyTrades = vi.fn();
  const exchange = {
    loadMarkets,
    fapiPrivateGetIncome,
    fetchMyTrades,
    markets_by_id: {} as Record<string, unknown>,
  };

  const binance = vi.fn(function BinanceMock() {
    return exchange;
  });

  return {
    loadMarkets,
    fapiPrivateGetIncome,
    fetchMyTrades,
    exchange,
    binance,
  };
});

vi.mock("ccxt", () => ({
  default: {
    binance: mockCcxt.binance,
  },
}));

import { fetchBinanceAccountFlows, fetchBinanceTrades } from "@/lib/exchange/binance";

describe("fetchBinanceTrades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCcxt.exchange.markets_by_id = {
      BTCUSDT: {
        id: "BTCUSDT",
        symbol: "BTC/USDT:USDT",
        linear: true,
        swap: true,
        active: true,
        quote: "USDT",
      },
      ETHUSDT: {
        id: "ETHUSDT",
        symbol: "ETH/USDT:USDT",
        linear: true,
        swap: true,
        active: true,
        quote: "USDT",
      },
    };
    mockCcxt.loadMarkets.mockResolvedValue({
      "BTC/USDT:USDT": mockCcxt.exchange.markets_by_id.BTCUSDT,
      "ETH/USDT:USDT": mockCcxt.exchange.markets_by_id.ETHUSDT,
    });
  });

  it("queries Binance futures trades with discovered symbols instead of undefined", async () => {
    const since = new Date("2026-05-01T00:00:00Z");
    mockCcxt.fapiPrivateGetIncome.mockResolvedValue([
      { symbol: "BTCUSDT", incomeType: "REALIZED_PNL" },
      { symbol: "ETHUSDT", incomeType: "COMMISSION" },
      { symbol: "BTCUSDT", incomeType: "FUNDING_FEE" },
      { symbol: "", incomeType: "TRANSFER" },
    ]);
    mockCcxt.fetchMyTrades.mockImplementation(async (symbol: string | undefined) =>
      symbol === "BTC/USDT:USDT"
        ? [
            {
              id: "123",
              symbol: "BTC/USDT:USDT",
              timestamp: since.getTime(),
              price: 100000,
              amount: 0.01,
              side: "sell",
              takerOrMaker: "taker",
              fee: { cost: 0.5 },
              info: { realizedPnl: "12.34" },
            },
          ]
        : []
    );

    const trades = await fetchBinanceTrades(
      { apiKey: "key", apiSecret: "secret", exchange: "binance" },
      since
    );

    expect(mockCcxt.fetchMyTrades).toHaveBeenCalledTimes(2);
    expect(mockCcxt.fetchMyTrades).toHaveBeenCalledWith(
      "BTC/USDT:USDT",
      since.getTime(),
      undefined,
      expect.objectContaining({ type: "future" })
    );
    expect(mockCcxt.fetchMyTrades).toHaveBeenCalledWith(
      "ETH/USDT:USDT",
      since.getTime(),
      undefined,
      expect.objectContaining({ type: "future" })
    );
    expect(mockCcxt.fetchMyTrades).not.toHaveBeenCalledWith(
      undefined,
      expect.any(Number),
      undefined,
      expect.any(Object)
    );
    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      externalId: "binance_order_BTCUSDT_123",
      symbol: "BTCUSDT",
      baseCoin: "BTC",
      realizedPnl: 12.34,
    });
  });

  it("aggregates multiple fills from the same Binance futures order into one trade", async () => {
    const since = new Date("2026-05-01T00:00:00Z");
    mockCcxt.fapiPrivateGetIncome.mockResolvedValue([
      { symbol: "BTCUSDT", incomeType: "REALIZED_PNL" },
    ]);
    mockCcxt.fetchMyTrades.mockResolvedValue([
      {
        id: "fill-1",
        symbol: "BTC/USDT:USDT",
        timestamp: since.getTime(),
        price: 100000,
        amount: 0.01,
        side: "sell",
        takerOrMaker: "taker",
        fee: { cost: 0.5 },
        info: { orderId: "order-1", realizedPnl: "12.34" },
      },
      {
        id: "fill-2",
        symbol: "BTC/USDT:USDT",
        timestamp: since.getTime() + 1000,
        price: 101000,
        amount: 0.02,
        side: "sell",
        takerOrMaker: "maker",
        fee: { cost: 0.1 },
        info: { orderId: "order-1", realizedPnl: "7.66" },
      },
    ]);

    const trades = await fetchBinanceTrades(
      { apiKey: "key", apiSecret: "secret", exchange: "binance" },
      since
    );

    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      externalId: "binance_order_BTCUSDT_order-1",
      symbol: "BTCUSDT",
      entryQty: 0.03,
      exitQty: 0.03,
      realizedPnl: 20,
      fee: 0.6,
      makerFee: 0.1,
      takerFee: 0.5,
    });
    expect(trades[0].entryPrice).toBeCloseTo(100666.66666666667);
    expect(trades[0].entryTime.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(trades[0].exitTime.toISOString()).toBe("2026-05-01T00:00:01.000Z");
  });

  it("aggregates a Binance futures position with partial closes into one closed trade", async () => {
    const since = new Date("2026-05-01T00:00:00Z");
    mockCcxt.exchange.markets_by_id = {
      HEIUSDT: {
        id: "HEIUSDT",
        symbol: "HEI/USDT:USDT",
        linear: true,
        swap: true,
        active: true,
        quote: "USDT",
      },
    };
    mockCcxt.loadMarkets.mockResolvedValue({
      "HEI/USDT:USDT": mockCcxt.exchange.markets_by_id.HEIUSDT,
    });
    mockCcxt.fapiPrivateGetIncome.mockResolvedValue([
      { symbol: "HEIUSDT", incomeType: "REALIZED_PNL" },
    ]);
    mockCcxt.fetchMyTrades.mockResolvedValue([
      {
        id: "open-fill",
        symbol: "HEI/USDT:USDT",
        timestamp: since.getTime(),
        price: 0.18,
        amount: 30000,
        side: "sell",
        takerOrMaker: "taker",
        fee: { cost: 2.5 },
        info: { orderId: "open-short", realizedPnl: "0" },
      },
      {
        id: "close-fill-1",
        symbol: "HEI/USDT:USDT",
        timestamp: since.getTime() + 60_000,
        price: 0.13,
        amount: 10000,
        side: "buy",
        takerOrMaker: "maker",
        fee: { cost: 0.4 },
        info: { orderId: "close-short-1", realizedPnl: "500" },
      },
      {
        id: "close-fill-2",
        symbol: "HEI/USDT:USDT",
        timestamp: since.getTime() + 120_000,
        price: 0.12,
        amount: 20000,
        side: "buy",
        takerOrMaker: "taker",
        fee: { cost: 0.8 },
        info: { orderId: "close-short-2", realizedPnl: "1200" },
      },
    ]);

    const trades = await fetchBinanceTrades(
      { apiKey: "key", apiSecret: "secret", exchange: "binance" },
      since
    );

    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      externalId: "binance_position_HEIUSDT_open-short_close-short-2",
      symbol: "HEIUSDT",
      side: "Short",
      entryQty: 30000,
      exitQty: 30000,
      entryValue: 5400,
      exitValue: 3700,
      realizedPnl: 1700,
      fee: 3.7,
      makerFee: 0.4,
      takerFee: 3.3,
    });
    expect(trades[0].entryPrice).toBeCloseTo(0.18);
    expect(trades[0].exitPrice).toBeCloseTo(0.1233333333);
    expect(trades[0].entryTime.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(trades[0].exitTime.toISOString()).toBe("2026-05-01T00:02:00.000Z");
  });
});

describe("fetchBinanceAccountFlows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps Binance income history into account flows including transfers and trading income", async () => {
    const since = new Date("2026-05-01T00:00:00Z");
    mockCcxt.fapiPrivateGetIncome.mockResolvedValue([
      {
        symbol: null,
        incomeType: "TRANSFER",
        income: "900.00000000",
        asset: "USDT",
        info: "deposit",
        time: since.getTime(),
        tranId: "transfer-1",
        tradeId: "",
      },
      {
        symbol: "BTCUSDT",
        incomeType: "REALIZED_PNL",
        income: "120.50000000",
        asset: "USDT",
        info: "",
        time: since.getTime() + 1000,
        tranId: "pnl-1",
        tradeId: "trade-1",
      },
      {
        symbol: "BTCUSDT",
        incomeType: "COMMISSION",
        income: "-2.50000000",
        asset: "USDT",
        info: "",
        time: since.getTime() + 2000,
        tranId: "fee-1",
        tradeId: "trade-1",
      },
    ]);

    const flows = await fetchBinanceAccountFlows(
      { apiKey: "key", apiSecret: "secret", exchange: "binance" },
      since
    );

    expect(mockCcxt.fapiPrivateGetIncome).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: since.getTime(),
        limit: 1000,
      })
    );
    expect(flows).toEqual([
      {
        externalId: "binance_income_TRANSFER_transfer-1__900.00000000",
        type: "TRANSFER",
        amount: 900,
        asset: "USDT",
        symbol: null,
        info: "deposit",
        time: new Date(since.getTime()),
      },
      {
        externalId: "binance_income_REALIZED_PNL_pnl-1_trade-1_120.50000000",
        type: "REALIZED_PNL",
        amount: 120.5,
        asset: "USDT",
        symbol: "BTCUSDT",
        info: "",
        time: new Date(since.getTime() + 1000),
      },
      {
        externalId: "binance_income_COMMISSION_fee-1_trade-1_-2.50000000",
        type: "COMMISSION",
        amount: -2.5,
        asset: "USDT",
        symbol: "BTCUSDT",
        info: "",
        time: new Date(since.getTime() + 2000),
      },
    ]);
  });

  it("splits long account-flow sync ranges into Binance income windows", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T00:00:00Z"));
    mockCcxt.fapiPrivateGetIncome.mockResolvedValue([]);

    const since = new Date("2025-05-31T00:00:00Z");
    await fetchBinanceAccountFlows(
      { apiKey: "key", apiSecret: "secret", exchange: "binance" },
      since
    );

    const calls = mockCcxt.fapiPrivateGetIncome.mock.calls.map(([params]) => params);
    expect(calls.length).toBeGreaterThan(1);
    expect(calls[0]).toEqual(
      expect.objectContaining({
        startTime: since.getTime(),
        limit: 1000,
      })
    );
    expect(calls.at(-1)).toEqual(
      expect.objectContaining({
        endTime: new Date("2026-05-31T00:00:00Z").getTime(),
      })
    );

    for (const params of calls) {
      expect(Number(params.endTime) - Number(params.startTime)).toBeLessThanOrEqual(
        89 * 24 * 60 * 60 * 1000
      );
    }
  });
});
