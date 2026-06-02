import { describe, expect, it } from "vitest";
import {
  buildKlineRequestWindow,
  calculateTradeExcursion,
  chooseKlineInterval,
  parseBinanceKlines,
} from "@/lib/market/klines";

describe("market kline helpers", () => {
  it("expands short trade windows with enough before and after context", () => {
    const startTime = Date.parse("2026-05-30T11:34:49Z");
    const endTime = startTime + 20_000;

    expect(buildKlineRequestWindow(startTime, endTime)).toEqual({
      startTime: startTime - 1_800_000,
      endTime: endTime + 1_800_000,
      interval: "1m",
    });
  });

  it("calculates trade excursion from the held period only", () => {
    const entryTime = Date.parse("2026-05-30T11:00:30Z");
    const exitTime = entryTime + 3 * 60_000;
    const firstCandleTime = Date.parse("2026-05-30T10:59:00Z");

    const excursion = calculateTradeExcursion(
      [
        { time: firstCandleTime, open: 100, high: 130, low: 70, close: 120 },
        { time: firstCandleTime + 60_000, open: 100, high: 103, low: 99, close: 101 },
        { time: firstCandleTime + 2 * 60_000, open: 101, high: 106, low: 94, close: 104 },
        { time: firstCandleTime + 3 * 60_000, open: 104, high: 105, low: 96, close: 102 },
        { time: firstCandleTime + 5 * 60_000, open: 104, high: 180, low: 40, close: 160 },
      ],
      {
        entryPrice: 100,
        entryTime,
        exitTime,
        side: "Long",
      }
    );

    expect(excursion).toEqual({
      maePercent: -6,
      maePrice: 94,
      mfePercent: 6,
      mfePrice: 106,
    });
  });

  it("chooses a readable Binance interval from the real time span", () => {
    expect(chooseKlineInterval(0, 90 * 60_000)).toBe("1m");
    expect(chooseKlineInterval(0, 12 * 60 * 60_000)).toBe("5m");
    expect(chooseKlineInterval(0, 4 * 24 * 60 * 60_000)).toBe("1h");
  });

  it("parses Binance futures kline rows into numeric OHLC candles", () => {
    const candles = parseBinanceKlines([
      [
        1_779_959_949_000,
        "0.1794",
        "0.1820",
        "0.1710",
        "0.1744",
        "12345",
        1_779_960_008_999,
      ],
    ]);

    expect(candles).toEqual([
      {
        time: 1_779_959_949_000,
        open: 0.1794,
        high: 0.182,
        low: 0.171,
        close: 0.1744,
      },
    ]);
  });
});
