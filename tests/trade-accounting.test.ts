import { describe, expect, it } from "vitest";
import { applyAccountFlowAccountingToTrades } from "@/lib/dashboard/trade-accounting";
import { makeTrade } from "./helpers";

describe("applyAccountFlowAccountingToTrades", () => {
  it("uses Binance income flows as net realised PnL for matched futures positions", () => {
    const trades = [
      makeTrade({
        exchangeId: "binance-1",
        symbol: "ALLOUSDT",
        side: "Long",
        entryTime: new Date("2026-06-01T05:10:44.511Z"),
        exitTime: new Date("2026-06-01T05:18:15.776Z"),
        realizedPnl: 105.77077,
        fee: 6.99022049,
        fundingFee: 0,
      }),
      makeTrade({
        exchangeId: "binance-1",
        symbol: "ALLOUSDT",
        side: "Short",
        entryTime: new Date("2026-06-01T02:38:46.746Z"),
        exitTime: new Date("2026-06-01T05:10:00.785Z"),
        realizedPnl: 1690.95683,
        fee: 3.67303582,
        fundingFee: 0,
      }),
      makeTrade({
        exchangeId: "binance-1",
        symbol: "ALLOUSDT",
        side: "Long",
        entryTime: new Date("2026-06-01T00:14:49.421Z"),
        exitTime: new Date("2026-06-01T00:35:10.449Z"),
        realizedPnl: -255.91092891,
        fee: 7.41167564,
        fundingFee: 0,
      }),
    ];

    const adjusted = applyAccountFlowAccountingToTrades(trades.map((trade, index) => ({
      ...trade, exchange: { name: "binance" }, externalId: `binance_position_${index}`,
    })), [
      flow("REALIZED_PNL", 105.77077, "2026-06-01T05:18:15.000Z"),
      flow("COMMISSION", -6.99022049, "2026-06-01T05:10:44.000Z"),
      flow("REALIZED_PNL", 1690.95683, "2026-06-01T05:10:00.000Z"),
      flow("COMMISSION", -3.67303582, "2026-06-01T02:38:46.000Z"),
      flow("FUNDING_FEE", -0.44314779, "2026-06-01T04:00:00.000Z"),
      flow("REALIZED_PNL", -255.91092891, "2026-06-01T00:35:10.000Z"),
      flow("COMMISSION", -7.41167564, "2026-06-01T00:14:49.000Z"),
    ]);

    expect(adjusted.map((trade) => trade.realizedPnl)).toEqual([
      98.78054951,
      1687.28379418,
      -263.32260455,
    ]);
    expect(adjusted.map((trade) => trade.fundingFee)).toEqual([0, 0, 0]);
    expect(adjusted[1].accountingStatus).toBe("needs-review");
    expect(adjusted.map((trade) => trade.isWin)).toEqual([true, true, false]);
  });
});

describe("conservative flow ownership", () => {
  function trade(start: string, end: string, pnl: number) {
    return { ...makeTrade({ exchangeId: "binance-1", externalId: `binance_position_${start}`, symbol: "ALLOUSDT",
      entryTime: new Date(start), exitTime: new Date(end), realizedPnl: pnl, fee: 0, fundingFee: 0 }), exchange: { name: "binance" } };
  }
  it("does not duplicate an adjacent trade's flows and is independent of input order", () => {
    const first = trade("2026-06-01T09:00:00Z", "2026-06-01T10:00:00Z", 100);
    const second = trade("2026-06-01T10:00:01Z", "2026-06-01T11:00:00Z", 20);
    const flows = [flow("REALIZED_PNL", 100, "2026-06-01T10:00:00Z"), flow("REALIZED_PNL", 20, "2026-06-01T11:00:00Z")];
    const actual = applyAccountFlowAccountingToTrades([first, second], flows);
    expect(actual.map(t => t.realizedPnl)).toEqual([100, 20]);
    expect(actual.map(t => t.accountingStatus)).toEqual(["needs-review", "needs-review"]);
    expect(applyAccountFlowAccountingToTrades([second, first], [...flows].reverse()).reverse()).toEqual(actual);
  });
  it("does not allocate a funding payment merely because only one closed candidate is visible", () => {
    const source = { ...trade("2026-06-01T09:00:00Z", "2026-06-01T11:00:00Z", 10), fee: 1 };
    const [actual] = applyAccountFlowAccountingToTrades([source], [flow("REALIZED_PNL", 10, "2026-06-01T11:00:00Z"), flow("COMMISSION", -1, "2026-06-01T09:00:00Z"), flow("FUNDING_FEE", -2, "2026-06-01T10:00:00Z")]);
    expect(actual).toMatchObject({ realizedPnl: 9, fundingFee: 0, accountingStatus: "needs-review" });
  });
  it("retains the imported net basis for Bybit and mock records", () => {
    const source = { ...trade("2026-06-01T09:00:00Z", "2026-06-01T11:00:00Z", 9), fee: 1 };
    const actual = applyAccountFlowAccountingToTrades([{ ...source, exchange: { name: "bybit" } }, { ...source, externalId: "mock_1" }], []);
    expect(actual.map(t => t.realizedPnl)).toEqual([9, 9]);
  });
  it("preserves known stored funding while converting imported gross to net", () => {
    const source = { ...trade("2026-06-01T09:00:00Z", "2026-06-01T11:00:00Z", 10), fee: 1, fundingFee: -2 };
    expect(applyAccountFlowAccountingToTrades([source], [flow("REALIZED_PNL", 10, "2026-06-01T11:00:00Z"), flow("COMMISSION", -1, "2026-06-01T09:00:00Z")])[0]).toMatchObject({ realizedPnl: 7, accountingStatus: "matched" });
  });
  it("does not overwrite imported net records even when partial gross flows exist", () => {
    const source = { ...trade("2026-06-01T09:00:00Z", "2026-06-01T11:00:00Z", 9), fee: 1 };
    for (const record of [{ ...source, exchange: { name: "bybit" } }, { ...source, externalId: "mock_1" }]) {
      expect(applyAccountFlowAccountingToTrades([record], [flow("REALIZED_PNL", 10, "2026-06-01T11:00:00Z")])[0])
        .toMatchObject({ realizedPnl: 9, fee: 1, accountingStatus: "needs-review" });
    }
  });
  it("does not replace imported totals with incomplete or foreign-account flows", () => {
    const source = { ...trade("2026-06-01T09:00:00Z", "2026-06-01T11:00:00Z", 10), fee: 1 };
    const partial = [flow("REALIZED_PNL", 6, "2026-06-01T11:00:00Z"), flow("COMMISSION", -1, "2026-06-01T09:00:00Z")];
    expect(applyAccountFlowAccountingToTrades([source], partial)[0]).toMatchObject({ realizedPnl: 9, accountingStatus: "needs-review" });
    expect(applyAccountFlowAccountingToTrades([source], partial.map(f => ({ ...f, exchangeId: "other" })))[0].realizedPnl).toBe(9);
  });
});

function flow(type: string, amount: number, time: string) {
  return {
    exchangeId: "binance-1",
    type,
    asset: "USDT",
    amount,
    symbol: "ALLOUSDT",
    time: new Date(time),
  };
}
