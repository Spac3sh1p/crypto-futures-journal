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

    const adjusted = applyAccountFlowAccountingToTrades(trades, [
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
      1686.84064639,
      -263.32260455,
    ]);
    expect(adjusted.map((trade) => trade.fundingFee)).toEqual([0, -0.44314779, 0]);
    expect(adjusted.map((trade) => trade.isWin)).toEqual([true, true, false]);
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
