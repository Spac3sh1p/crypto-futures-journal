import { describe, expect, it } from "vitest";
import {
  buildTradeHistoryHref,
  filterTradesForHistory,
  normalizeTradeFilters,
  normalizeDashboardParams,
  getInitialTradeHistoryPage,
} from "@/lib/dashboard/trade-history-routing";

describe("buildTradeHistoryHref", () => {
  it("builds a focused trade history link that keeps the trade visible", () => {
    expect(buildTradeHistoryHref({ tradeId: "trade-123", exchangeId: "ex-1" })).toBe(
      "/dashboard/performance?view=trades&range=all&tradeId=trade-123&exchangeId=ex-1"
    );
  });
});

describe("trade drill-down scope", () => {
  const trades = [
    { symbol: "BTCUSDT", side: "Long", tags: "trend, scalp", entryTime: new Date(2026, 8, 4, 1, 59), exitTime: new Date(2026, 8, 5, 0, 1) },
    { symbol: "BTCUSDT", side: "Short", tags: "trendline", entryTime: new Date(2026, 8, 4, 2, 0), exitTime: new Date(2026, 8, 4, 23, 59) },
  ];
  it("preserves account and range while encoding exact symbol and tag filters", () => {
    const url = new URL(buildTradeHistoryHref({ range: "7d", exchangeId: "account 1", symbol: "BTC/USDT:USDT", tag: "A&B", entrySlot: "0" }), "http://localhost");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ range: "7d", exchangeId: "account 1", symbol: "BTC/USDT:USDT", tag: "A&B", entrySlot: "0" });
  });
  it("filters calendar by exit date and analytics by entry time, with an exclusive slot end", () => {
    expect(filterTradesForHistory(trades, { exitDate: "2026-09-05", entrySlot: "0", entryDay: "Fri" })).toEqual([trades[0]]);
    expect(filterTradesForHistory(trades, { entrySlot: "2" })).toEqual([trades[1]]);
    expect(filterTradesForHistory(trades, { entrySlot: "0", exitDate: "2026-09-04" })).toEqual([]);
  });
  it("matches full tags and supports intersecting filters without changing input", () => {
    expect(filterTradesForHistory(trades, { symbol: "BTCUSDT", side: "Long", tag: "trend" })).toEqual([trades[0]]);
    expect(filterTradesForHistory(trades, { tag: "scal" })).toEqual([]);
    expect(trades).toHaveLength(2);
  });
  it("ignores invalid dates, slots, directions and weekdays", () => {
    expect(Object.values(normalizeTradeFilters({ exitDate: "2026-02-30", entrySlot: "-2", side: "buy", entryDay: "Funday" })).filter(Boolean)).toEqual([]);
    expect(filterTradesForHistory(trades, { exitDate: "bad", entrySlot: "24" })).toEqual(trades);
  });
  it("normalizes repeated query parameters before filtering or database queries", () => {
    expect(normalizeDashboardParams({ symbol: ["BTCUSDT", "ETHUSDT"], exchangeId: ["one", "two"], range: "7d" }))
      .toEqual({ symbol: "BTCUSDT", exchangeId: "one", range: "7d" });
  });
});

describe("getInitialTradeHistoryPage", () => {
  it("returns the page containing the focused trade", () => {
    const tradeIds = Array.from({ length: 45 }, (_, index) => `trade-${index + 1}`);

    expect(getInitialTradeHistoryPage(tradeIds, "trade-1", 20)).toBe(1);
    expect(getInitialTradeHistoryPage(tradeIds, "trade-21", 20)).toBe(2);
    expect(getInitialTradeHistoryPage(tradeIds, "trade-45", 20)).toBe(3);
  });

  it("falls back to the first page when no focus id is provided or found", () => {
    expect(getInitialTradeHistoryPage(["a", "b"], undefined, 20)).toBe(1);
    expect(getInitialTradeHistoryPage(["a", "b"], "missing", 20)).toBe(1);
  });
});
