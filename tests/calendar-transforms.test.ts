import { describe, expect, it } from "vitest";
import {
  buildMonthlyCalendar,
  getMonthDateRange,
  normalizeMonthParam,
} from "@/lib/dashboard/calendar-transforms";
import { makeTrade } from "./helpers";

describe("normalizeMonthParam", () => {
  it("accepts YYYY-MM and falls back when the month is invalid", () => {
    const fallback = new Date(2026, 5, 2);

    expect(normalizeMonthParam("2026-05", fallback)).toBe("2026-05");
    expect(normalizeMonthParam("2026-13", fallback)).toBe("2026-06");
    expect(normalizeMonthParam("not-a-month", fallback)).toBe("2026-06");
  });
});

describe("getMonthDateRange", () => {
  it("returns an exclusive next-month end boundary", () => {
    const range = getMonthDateRange("2026-05");

    expect(range.start).toEqual(new Date(2026, 4, 1));
    expect(range.end).toEqual(new Date(2026, 5, 1));
  });
});

describe("buildMonthlyCalendar", () => {
  it("builds Monday-first weeks and month summary without best or worst week fields", () => {
    const trades = [
      makeTrade({
        id: "t1",
        symbol: "BTCUSDT",
        side: "Short",
        realizedPnl: 15,
        isWin: true,
        exitTime: new Date("2026-05-18T12:00:00Z"),
      }),
      makeTrade({
        id: "t2",
        symbol: "BTCUSDT",
        side: "Long",
        realizedPnl: 15.45,
        isWin: true,
        exitTime: new Date("2026-05-20T12:00:00Z"),
      }),
      makeTrade({
        id: "t3",
        symbol: "BTCUSDT",
        side: "Short",
        realizedPnl: -10.61,
        isWin: false,
        exitTime: new Date("2026-05-20T13:00:00Z"),
      }),
      makeTrade({
        id: "t4",
        symbol: "BTCUSDT",
        side: "Short",
        realizedPnl: -8.5,
        isWin: false,
        exitTime: new Date("2026-05-21T12:00:00Z"),
      }),
      makeTrade({
        id: "t5",
        symbol: "XAUUSD",
        side: "Short",
        realizedPnl: 2.1,
        isWin: true,
        exitTime: new Date("2026-05-21T13:00:00Z"),
      }),
      makeTrade({
        id: "t6",
        symbol: "ETHUSDT",
        side: "Long",
        realizedPnl: -5.3,
        isWin: false,
        exitTime: new Date("2026-05-21T14:00:00Z"),
      }),
      makeTrade({
        id: "t7",
        symbol: "BTCUSDT",
        side: "Long",
        realizedPnl: -3.2,
        isWin: false,
        exitTime: new Date("2026-05-21T15:00:00Z"),
      }),
      makeTrade({
        id: "t8",
        symbol: "XAUUSD",
        side: "Long",
        realizedPnl: 0,
        isWin: false,
        exitTime: new Date("2026-05-22T12:00:00Z"),
      }),
      makeTrade({
        id: "t9",
        symbol: "BTCUSDT",
        side: "Short",
        realizedPnl: 40.4,
        isWin: true,
        exitTime: new Date("2026-05-23T12:00:00Z"),
      }),
      makeTrade({
        id: "t10",
        symbol: "VETUSDT",
        side: "Long",
        realizedPnl: -10.9,
        isWin: false,
        exitTime: new Date("2026-05-26T12:00:00Z"),
      }),
      makeTrade({
        id: "t11",
        symbol: "ROSEUSDT",
        side: "Long",
        realizedPnl: 1,
        isWin: true,
        exitTime: new Date("2026-05-26T13:00:00Z"),
      }),
      makeTrade({
        id: "t12",
        symbol: "DOTUSDT",
        side: "Long",
        realizedPnl: 0,
        isWin: false,
        exitTime: new Date("2026-05-26T14:00:00Z"),
      }),
      makeTrade({
        id: "t13",
        symbol: "BTCUSDT",
        side: "Short",
        realizedPnl: -10.9,
        isWin: false,
        exitTime: new Date("2026-05-26T15:00:00Z"),
      }),
      makeTrade({
        id: "t14",
        symbol: "ARBUSDT",
        side: "Long",
        realizedPnl: -2,
        isWin: false,
        exitTime: new Date("2026-05-27T12:00:00Z"),
      }),
      makeTrade({
        id: "t15",
        symbol: "DOTUSDT",
        side: "Long",
        realizedPnl: -6.3,
        isWin: false,
        exitTime: new Date("2026-05-27T13:00:00Z"),
      }),
      makeTrade({
        id: "t16",
        symbol: "ROSEUSDT",
        side: "Long",
        realizedPnl: -5.25,
        isWin: false,
        exitTime: new Date("2026-05-27T14:00:00Z"),
      }),
      makeTrade({
        id: "t17",
        symbol: "SANDUSDT",
        side: "Long",
        realizedPnl: -3.15,
        isWin: false,
        exitTime: new Date("2026-05-27T15:00:00Z"),
      }),
      makeTrade({
        id: "t18",
        symbol: "BTCUSDT",
        side: "Short",
        realizedPnl: 35.5,
        isWin: true,
        exitTime: new Date("2026-05-28T12:00:00Z"),
      }),
      makeTrade({
        id: "t19",
        symbol: "BTCUSDT",
        side: "Short",
        realizedPnl: 35.5,
        isWin: true,
        exitTime: new Date("2026-05-28T13:00:00Z"),
      }),
    ];

    const summary = buildMonthlyCalendar(trades, "2026-05");

    expect(summary.month).toBe("2026-05");
    expect(summary.totalPnl).toBeCloseTo(78.84);
    expect(summary.greenDays).toBe(4);
    expect(summary.redDays).toBe(3);
    expect(summary.flatDays).toBe(1);
    expect(summary.tradingDays).toBe(8);
    expect(summary.tradeCount).toBe(19);
    expect(summary.bestTrade).toMatchObject({ symbol: "BTCUSDT", pnl: 40.4 });
    expect(summary.worstTrade).toMatchObject({ symbol: "VETUSDT", pnl: -10.9 });
    expect(summary.topSymbol).toMatchObject({ symbol: "BTCUSDT", tradeCount: 9 });
    expect(summary.weeks[0].days.map((day) => day.date)).toEqual([
      "2026-04-27",
      "2026-04-28",
      "2026-04-29",
      "2026-04-30",
      "2026-05-01",
      "2026-05-02",
      "2026-05-03",
    ]);
    expect(summary.weeks.map((week) => week.label)).toEqual(["WK1", "WK2", "WK3", "WK4", "WK5"]);
    expect(summary.weeks[3].pnl).toBeCloseTo(45.34);
    expect(summary.weeks[4].pnl).toBeCloseTo(33.5);
    expect(summary).not.toHaveProperty("bestWeek");
    expect(summary).not.toHaveProperty("worstWeek");
  });
});
