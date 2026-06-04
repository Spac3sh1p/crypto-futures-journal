import { describe, it, expect } from "vitest";
import {
  buildStatistics,
  buildSideBreakdown,
  buildDurationReport,
  buildFeesReport,
  buildSizeReport,
  buildSymbolTop10Report,
  buildSymbolsReport,
} from "@/lib/dashboard/analytics-transforms";
import { makeTrade } from "./helpers";

describe("buildStatistics", () => {
  it("returns zeros for empty trades", () => {
    const s = buildStatistics([]);
    expect(s.totalGainLoss).toBe(0);
    expect(s.tradeExpectancy).toBe(0);
    expect(s.tradingDays).toBe(0);
    expect(s.largestGain).toBe(0);
    expect(s.largestLoss).toBe(0);
  });

  it("calculates statistics for normal trades", () => {
    const trades = [
      makeTrade({
        realizedPnl: 200,
        isWin: true,
        entryValue: 5000,
        exitTime: new Date("2024-01-15T12:00:00Z"),
      }),
      makeTrade({
        realizedPnl: -50,
        isWin: false,
        entryValue: 3000,
        exitTime: new Date("2024-01-15T14:00:00Z"),
      }),
      makeTrade({
        realizedPnl: 80,
        isWin: true,
        entryValue: 4000,
        exitTime: new Date("2024-01-16T10:00:00Z"),
      }),
    ];
    const s = buildStatistics(trades);

    expect(s.totalGainLoss).toBe(230);
    expect(s.tradeExpectancy).toBeCloseTo(76.67, 1);
    expect(s.tradingDays).toBe(2);
    expect(s.avgDailyGain).toBe(115);
    expect(s.totalTradesVolume).toBe(12000);
    expect(s.largestGain).toBe(200);
    expect(s.largestLoss).toBe(-50);
    expect(s.avgTradeWin).toBe(140);
    expect(s.avgTradeLoss).toBe(-50);
  });

  it("calculates consecutive wins/losses sorted by exitTime", () => {
    const trades = [
      makeTrade({ realizedPnl: 10, isWin: true, exitTime: new Date("2024-01-15T10:00:00Z") }),
      makeTrade({ realizedPnl: 20, isWin: true, exitTime: new Date("2024-01-15T11:00:00Z") }),
      makeTrade({ realizedPnl: -5, isWin: false, exitTime: new Date("2024-01-15T12:00:00Z") }),
      makeTrade({ realizedPnl: -8, isWin: false, exitTime: new Date("2024-01-15T13:00:00Z") }),
      makeTrade({ realizedPnl: -3, isWin: false, exitTime: new Date("2024-01-15T14:00:00Z") }),
    ];
    const s = buildStatistics(trades);

    expect(s.maxConsecutiveWin).toBe(2);
    expect(s.maxConsecutiveLoss).toBe(3);
  });
});

describe("buildSideBreakdown", () => {
  it("returns zeros when no trades match the side", () => {
    const trades = [makeTrade({ side: "Long" })];
    const result = buildSideBreakdown(trades, "Short");

    expect(result.count).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.totalPnl).toBe(0);
  });

  it("calculates Long breakdown correctly", () => {
    const trades = [
      makeTrade({ side: "Long", realizedPnl: 100, isWin: true, holdDuration: 3600 }),
      makeTrade({ side: "Long", realizedPnl: -30, isWin: false, holdDuration: 7200 }),
      makeTrade({ side: "Short", realizedPnl: 50, isWin: true, holdDuration: 1800 }),
    ];
    const result = buildSideBreakdown(trades, "Long");

    expect(result.side).toBe("Long");
    expect(result.count).toBe(2);
    expect(result.percentage).toBeCloseTo(66.67, 1);
    expect(result.winCount).toBe(1);
    expect(result.lossCount).toBe(1);
    expect(result.winRate).toBe(50);
    expect(result.avgDuration).toBe(5400);
    expect(result.totalPnl).toBe(70);
    expect(result.avgWin).toBe(100);
    expect(result.avgLoss).toBe(30);
  });

  it("calculates Short breakdown correctly", () => {
    const trades = [
      makeTrade({ side: "Short", realizedPnl: -20, isWin: false, holdDuration: 600 }),
      makeTrade({ side: "Short", realizedPnl: 80, isWin: true, holdDuration: 1200 }),
      makeTrade({ side: "Long", realizedPnl: 50, isWin: true, holdDuration: 3000 }),
    ];
    const result = buildSideBreakdown(trades, "Short");

    expect(result.side).toBe("Short");
    expect(result.count).toBe(2);
    expect(result.winCount).toBe(1);
    expect(result.lossCount).toBe(1);
    expect(result.totalPnl).toBe(60);
  });
});

describe("buildDurationReport", () => {
  it("returns 5 buckets with zeros for empty trades", () => {
    const result = buildDurationReport([]);
    expect(result).toHaveLength(5);
    result.forEach((b) => {
      expect(b.wins).toBe(0);
      expect(b.losses).toBe(0);
    });
  });

  it("places trades in correct buckets by boundary", () => {
    const trades = [
      makeTrade({ holdDuration: 30, isWin: true }),     // bucket 0: [0, 60)
      makeTrade({ holdDuration: 59, isWin: false }),    // bucket 0: [0, 60)
      makeTrade({ holdDuration: 60, isWin: true }),     // bucket 1: [60, 6900)
      makeTrade({ holdDuration: 6899, isWin: false }),  // bucket 1: [60, 6900)
      makeTrade({ holdDuration: 6900, isWin: true }),   // bucket 2: [6900, 13740)
      makeTrade({ holdDuration: 13740, isWin: true }),  // bucket 3: [13740, 20580)
      makeTrade({ holdDuration: 20580, isWin: false }), // bucket 4: [20580, Infinity)
    ];
    const result = buildDurationReport(trades);

    expect(result[0].wins).toBe(1);
    expect(result[0].losses).toBe(1);
    expect(result[1].wins).toBe(1);
    expect(result[1].losses).toBe(1);
    expect(result[2].wins).toBe(1);
    expect(result[2].losses).toBe(0);
    expect(result[3].wins).toBe(1);
    expect(result[3].losses).toBe(0);
    expect(result[4].wins).toBe(0);
    expect(result[4].losses).toBe(1);
  });
});

describe("buildSizeReport", () => {
  it("returns empty array for no trades", () => {
    expect(buildSizeReport([])).toEqual([]);
  });

  it("returns 4 buckets for trades with varying sizes", () => {
    const trades = [
      makeTrade({ entryValue: 1000, isWin: true }),
      makeTrade({ entryValue: 2000, isWin: false }),
      makeTrade({ entryValue: 3000, isWin: true }),
      makeTrade({ entryValue: 4000, isWin: false }),
    ];
    const result = buildSizeReport(trades);

    expect(result).toHaveLength(4);
    const totalWins = result.reduce((s, b) => s + b.wins, 0);
    const totalLosses = result.reduce((s, b) => s + b.losses, 0);
    expect(totalWins).toBe(2);
    expect(totalLosses).toBe(2);
  });

  it("handles single trade (step = 1 when range is 0)", () => {
    const trades = [makeTrade({ entryValue: 5000, isWin: true })];
    const result = buildSizeReport(trades);
    expect(result).toHaveLength(4);
  });
});

describe("buildSymbolsReport", () => {
  it("returns empty array for no trades", () => {
    expect(buildSymbolsReport([])).toEqual([]);
  });

  it("groups by symbol and sorts alphabetically", () => {
    const trades = [
      makeTrade({ symbol: "ETHUSDT", realizedPnl: 50, isWin: true, side: "Long", holdDuration: 3600, entryValue: 2000 }),
      makeTrade({ symbol: "BTCUSDT", realizedPnl: -20, isWin: false, side: "Short", holdDuration: 7200, entryValue: 5000 }),
      makeTrade({ symbol: "BTCUSDT", realizedPnl: 100, isWin: true, side: "Long", holdDuration: 1800, entryValue: 6000 }),
    ];
    const result = buildSymbolsReport(trades);

    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe("BTCUSDT");
    expect(result[1].symbol).toBe("ETHUSDT");
  });

  it("calculates per-symbol stats correctly", () => {
    const trades = [
      makeTrade({ symbol: "SOLUSDT", realizedPnl: 30, isWin: true, side: "Long", holdDuration: 600, entryValue: 1000 }),
      makeTrade({ symbol: "SOLUSDT", realizedPnl: -10, isWin: false, side: "Short", holdDuration: 1200, entryValue: 2000 }),
    ];
    const result = buildSymbolsReport(trades);

    expect(result).toHaveLength(1);
    const sol = result[0];
    expect(sol.symbol).toBe("SOLUSDT");
    expect(sol.tradeCount).toBe(2);
    expect(sol.winRate).toBe(50);
    expect(sol.longPercent).toBe(50);
    expect(sol.shortPercent).toBe(50);
    expect(sol.avgDuration).toBe(900);
    expect(sol.totalGain).toBe(20);
    expect(sol.avgGain).toBe(10);
  });
});

describe("buildSymbolTop10Report", () => {
  it("returns empty array for no trades", () => {
    expect(buildSymbolTop10Report([])).toEqual([]);
  });

  it("calculates symbol return from total pnl divided by total entry value", () => {
    const result = buildSymbolTop10Report([
      makeTrade({ symbol: "BTCUSDT", realizedPnl: 100, isWin: true, entryValue: 1000 }),
      makeTrade({ symbol: "BTCUSDT", realizedPnl: -25, isWin: false, entryValue: 500 }),
      makeTrade({ symbol: "ETHUSDT", realizedPnl: 50, isWin: true, entryValue: 2000 }),
    ]);

    const btc = result.find((row) => row.symbol === "BTCUSDT");
    expect(btc).toEqual({
      rank: 1,
      symbol: "BTCUSDT",
      netPnl: 75,
      returnPct: 5,
      winRate: 50,
      tradeCount: 2,
      totalEntryValue: 1500,
    });
  });

  it("sorts by return percent descending and limits to 10 symbols", () => {
    const trades = Array.from({ length: 12 }, (_, index) => {
      const score = index + 1;
      return makeTrade({
        symbol: `SYM${String(score).padStart(2, "0")}USDT`,
        realizedPnl: score,
        entryValue: 100,
        isWin: true,
      });
    });

    const result = buildSymbolTop10Report(trades);

    expect(result).toHaveLength(10);
    expect(result[0]).toMatchObject({ rank: 1, symbol: "SYM12USDT", returnPct: 12 });
    expect(result[9]).toMatchObject({ rank: 10, symbol: "SYM03USDT", returnPct: 3 });
  });

  it("keeps zero-entry symbols ranked after finite returns", () => {
    const result = buildSymbolTop10Report([
      makeTrade({ symbol: "ZEROCUSDT", realizedPnl: 30, entryValue: 0, isWin: true }),
      makeTrade({ symbol: "SOLUSDT", realizedPnl: -10, entryValue: 100, isWin: false }),
    ]);

    expect(result[0]).toMatchObject({ symbol: "SOLUSDT", returnPct: -10 });
    expect(result[1]).toMatchObject({ symbol: "ZEROCUSDT", returnPct: null });
  });
});

describe("buildFeesReport", () => {
  it("separates positive maker fees from negative maker rebates", () => {
    const result = buildFeesReport([
      makeTrade({ makerFee: -2, takerFee: 0, fee: -2 }),
      makeTrade({ makerFee: 3, takerFee: 0, fee: 3 }),
      makeTrade({ makerFee: 0, takerFee: 10, fee: 10 }),
    ]);

    expect(result.makerRebates).toBe(2);
    expect(result.marketFeesPaid).toBe(13);
    expect(result.net).toBe(-11);
  });
});
