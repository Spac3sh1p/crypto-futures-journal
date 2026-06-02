import { describe, expect, it } from "vitest";
import {
  buildTradeHistoryHref,
  getInitialTradeHistoryPage,
} from "@/lib/dashboard/trade-history-routing";

describe("buildTradeHistoryHref", () => {
  it("builds a focused trade history link that keeps the trade visible", () => {
    expect(buildTradeHistoryHref({ tradeId: "trade-123", exchangeId: "ex-1" })).toBe(
      "/dashboard/performance?view=trades&range=all&tradeId=trade-123&exchangeId=ex-1"
    );
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
