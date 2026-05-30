import { describe, expect, it } from "vitest";
import {
  buildKlineRequestWindow,
  chooseKlineInterval,
  parseBinanceKlines,
} from "@/lib/market/klines";

describe("market kline helpers", () => {
  it("pads short trade windows without changing to fake candles", () => {
    const startTime = Date.parse("2026-05-30T11:34:49Z");
    const endTime = startTime + 20_000;

    expect(buildKlineRequestWindow(startTime, endTime)).toEqual({
      startTime: startTime - 300_000,
      endTime: endTime + 300_000,
      interval: "1m",
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
