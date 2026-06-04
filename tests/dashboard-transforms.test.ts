import { describe, expect, it } from "vitest";
import {
  buildAccountFlowPnlSeries,
  buildCumulativePnlSeries,
  calculateAnnualizedSharpeRatio,
} from "@/lib/dashboard/transforms";
import { makeTrade } from "./helpers";

describe("buildCumulativePnlSeries", () => {
  it("aggregates same-day trades before calculating the cumulative equity curve", () => {
    const trades = [
      makeTrade({
        realizedPnl: 30,
        exitTime: new Date("2024-01-16T10:00:00Z"),
      }),
      makeTrade({
        realizedPnl: 100,
        exitTime: new Date("2024-01-15T11:00:00Z"),
      }),
      makeTrade({
        realizedPnl: -40,
        exitTime: new Date("2024-01-15T14:00:00Z"),
      }),
    ];

    expect(buildCumulativePnlSeries(trades)).toEqual([
      { date: "2024-01-15", value: 60 },
      { date: "2024-01-16", value: 90 },
    ]);
  });
});

describe("buildAccountFlowPnlSeries", () => {
  it("excludes transfers from trading PnL and uses net deposits for return percent", () => {
    const flows = [
      { type: "TRANSFER", amount: 900, asset: "USDT", time: new Date("2024-01-01T12:00:00Z") },
      { type: "REALIZED_PNL", amount: 100, asset: "USDT", time: new Date("2024-01-02T12:00:00Z") },
      { type: "COMMISSION", amount: -5, asset: "USDT", time: new Date("2024-01-02T13:00:00Z") },
      { type: "FUNDING_FEE", amount: -2, asset: "USDT", time: new Date("2024-01-03T12:00:00Z") },
      { type: "TRANSFER", amount: 500, asset: "USDT", time: new Date("2024-01-04T12:00:00Z") },
      { type: "REALIZED_PNL", amount: 200, asset: "USDT", time: new Date("2024-01-05T12:00:00Z") },
    ];

    expect(buildAccountFlowPnlSeries(flows)).toEqual([
      { date: "2024-01-01", value: 0, returnPct: 0, dailyReturnPct: 0, netDeposits: 900 },
      { date: "2024-01-02", value: 95, returnPct: 10.555555555555555, dailyReturnPct: 10.555555555555555, netDeposits: 900 },
      { date: "2024-01-03", value: 93, returnPct: 10.333333333333334, dailyReturnPct: -0.2222222222222222, netDeposits: 900 },
      { date: "2024-01-04", value: 93, returnPct: 6.642857142857143, dailyReturnPct: 0, netDeposits: 1400 },
      { date: "2024-01-05", value: 293, returnPct: 20.92857142857143, dailyReturnPct: 14.285714285714285, netDeposits: 1400 },
    ]);
  });

  it("keeps prior deposits as the denominator when rendering a later visible range", () => {
    const flows = [
      { type: "TRANSFER", amount: 900, asset: "USDT", time: new Date("2024-01-01T12:00:00Z") },
      { type: "REALIZED_PNL", amount: 100, asset: "USDT", time: new Date("2024-01-02T12:00:00Z") },
      { type: "TRANSFER", amount: 500, asset: "USDT", time: new Date("2024-01-04T12:00:00Z") },
      { type: "REALIZED_PNL", amount: 200, asset: "USDT", time: new Date("2024-01-05T12:00:00Z") },
    ];

    expect(buildAccountFlowPnlSeries(flows, new Date("2024-01-04T05:00:00Z"))).toEqual([
      { date: "2024-01-04", value: 100, returnPct: 7.142857142857142, dailyReturnPct: 0, netDeposits: 1400 },
      { date: "2024-01-05", value: 300, returnPct: 21.428571428571427, dailyReturnPct: 14.285714285714285, netDeposits: 1400 },
    ]);
  });
});

describe("calculateAnnualizedSharpeRatio", () => {
  it("annualizes daily returns using net deposits as the denominator", () => {
    const points = [
      { date: "2024-01-01", value: 10, returnPct: 1, dailyReturnPct: 1, netDeposits: 1000 },
      { date: "2024-01-02", value: 30, returnPct: 3, dailyReturnPct: 2, netDeposits: 1000 },
      { date: "2024-01-03", value: 15, returnPct: 1.5, dailyReturnPct: -1.5, netDeposits: 1000 },
    ];

    expect(calculateAnnualizedSharpeRatio(points)).toBeCloseTo(5.2988, 4);
  });

  it("returns null when there are fewer than two valid daily returns", () => {
    expect(calculateAnnualizedSharpeRatio([
      { date: "2024-01-01", value: 10, returnPct: 1, dailyReturnPct: 1, netDeposits: 1000 },
    ])).toBeNull();
  });

  it("returns null when daily returns have no volatility", () => {
    const points = [
      { date: "2024-01-01", value: 10, returnPct: 1, dailyReturnPct: 1, netDeposits: 1000 },
      { date: "2024-01-02", value: 20, returnPct: 2, dailyReturnPct: 1, netDeposits: 1000 },
      { date: "2024-01-03", value: 30, returnPct: 3, dailyReturnPct: 1, netDeposits: 1000 },
    ];

    expect(calculateAnnualizedSharpeRatio(points)).toBeNull();
  });
});
