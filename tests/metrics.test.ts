import { describe, it, expect } from "vitest";
import { calculateMetrics } from "@/lib/analysis/metrics";
import { makeTrade } from "./helpers";

describe("calculateMetrics", () => {
  it("returns all zeros for empty trades", () => {
    const m = calculateMetrics([]);
    expect(m.totalPnl).toBe(0);
    expect(m.winRate).toBe(0);
    expect(m.profitFactor).toBe(0);
    expect(m.totalTrades).toBe(0);
    expect(m.winCount).toBe(0);
    expect(m.lossCount).toBe(0);
    expect(m.avgWin).toBe(0);
    expect(m.avgLoss).toBe(0);
    expect(m.maxDrawdown).toBe(0);
    expect(m.maxConsecutiveWins).toBe(0);
    expect(m.maxConsecutiveLosses).toBe(0);
  });

  it("calculates correctly for all wins", () => {
    const trades = [
      makeTrade({ realizedPnl: 100, isWin: true, fee: 5 }),
      makeTrade({ realizedPnl: 200, isWin: true, fee: 10 }),
      makeTrade({ realizedPnl: 50, isWin: true, fee: 3 }),
    ];
    const m = calculateMetrics(trades);

    expect(m.totalTrades).toBe(3);
    expect(m.winCount).toBe(3);
    expect(m.lossCount).toBe(0);
    expect(m.winRate).toBe(100);
    expect(m.totalPnl).toBe(350);
    expect(m.profitFactor).toBe(350); // grossLoss = 0, returns grossProfit
    expect(m.avgWin).toBeCloseTo(116.67, 1);
    expect(m.avgLoss).toBe(0);
    expect(m.maxConsecutiveWins).toBe(3);
    expect(m.maxConsecutiveLosses).toBe(0);
    expect(m.maxDrawdown).toBe(0);
  });

  it("calculates correctly for all losses", () => {
    const trades = [
      makeTrade({ realizedPnl: -80, isWin: false, fee: 5 }),
      makeTrade({ realizedPnl: -120, isWin: false, fee: 5 }),
    ];
    const m = calculateMetrics(trades);

    expect(m.winRate).toBe(0);
    expect(m.winCount).toBe(0);
    expect(m.lossCount).toBe(2);
    expect(m.totalPnl).toBe(-200);
    expect(m.profitFactor).toBe(0); // grossProfit = 0, 0 / grossLoss = 0
    expect(m.avgWin).toBe(0);
    expect(m.avgLoss).toBe(-100);
    expect(m.maxConsecutiveWins).toBe(0);
    expect(m.maxConsecutiveLosses).toBe(2);
    expect(m.maxDrawdown).toBe(200);
  });

  it("calculates consecutive streaks correctly", () => {
    const trades = [
      makeTrade({ realizedPnl: 50, isWin: true }),
      makeTrade({ realizedPnl: 30, isWin: true }),
      makeTrade({ realizedPnl: 20, isWin: true }),
      makeTrade({ realizedPnl: -10, isWin: false }),
      makeTrade({ realizedPnl: -20, isWin: false }),
      makeTrade({ realizedPnl: 40, isWin: true }),
    ];
    const m = calculateMetrics(trades);

    expect(m.maxConsecutiveWins).toBe(3);
    expect(m.maxConsecutiveLosses).toBe(2);
  });

  it("calculates max drawdown correctly", () => {
    const trades = [
      makeTrade({ realizedPnl: 100, isWin: true }),
      makeTrade({ realizedPnl: 50, isWin: true }),
      makeTrade({ realizedPnl: -80, isWin: false }),
      makeTrade({ realizedPnl: -60, isWin: false }),
      makeTrade({ realizedPnl: 30, isWin: true }),
    ];
    const m = calculateMetrics(trades);

    // cumPnl: 100, 150 (peak), 70, 10, 40
    // drawdown from peak 150: 150-70=80, 150-10=140, 150-40=110
    expect(m.maxDrawdown).toBe(140);
  });

  it("calculates profit factor as ratio of gross profit to gross loss", () => {
    const trades = [
      makeTrade({ realizedPnl: 200, isWin: true }),
      makeTrade({ realizedPnl: -100, isWin: false }),
    ];
    const m = calculateMetrics(trades);
    expect(m.profitFactor).toBe(2); // 200 / 100
  });

  it("calculates fees and net PnL correctly", () => {
    const trades = [
      makeTrade({ realizedPnl: 100, isWin: true, fee: 10 }),
      makeTrade({ realizedPnl: -50, isWin: false, fee: 8 }),
    ];
    const m = calculateMetrics(trades);

    expect(m.totalFees).toBe(18);
    expect(m.netPnlAfterFees).toBe(50 - 18); // totalPnl(50) - fees(18)
    expect(m.expectancy).toBe(25); // 50 / 2
  });
});
