import { describe, expect, it } from "vitest";
import {
  bybitIntervalForKlineInterval,
  buildKlineRequestWindow,
  calculateTradeExcursion,
  chooseKlineInterval,
  parseBybitKlines,
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

  it("maps readable kline intervals to Bybit API interval values", () => {
    expect(bybitIntervalForKlineInterval("1m")).toBe("1");
    expect(bybitIntervalForKlineInterval("5m")).toBe("5");
    expect(bybitIntervalForKlineInterval("15m")).toBe("15");
    expect(bybitIntervalForKlineInterval("1h")).toBe("60");
    expect(bybitIntervalForKlineInterval("4h")).toBe("240");
  });

  it("parses Bybit futures kline responses into ascending numeric OHLC candles", () => {
    const candles = parseBybitKlines({
      retCode: 0,
      result: {
        list: [
          ["1779959949000", "591.97", "593.12", "589.40", "590.11", "10", "5900"],
          ["1779959889000", "621.44", "623.00", "590.00", "591.97", "12", "7300"],
        ],
      },
    });

    expect(candles).toEqual([
      {
        time: 1_779_959_889_000,
        open: 621.44,
        high: 623,
        low: 590,
        close: 591.97,
      },
      {
        time: 1_779_959_949_000,
        open: 591.97,
        high: 593.12,
        low: 589.4,
        close: 590.11,
      },
    ]);
  });
});
