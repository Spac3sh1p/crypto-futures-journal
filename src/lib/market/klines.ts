export type BinanceKlineInterval = "1m" | "5m" | "15m" | "1h" | "4h";

export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const MINUTE_MS = 60_000;
const MAX_VISIBLE_CANDLES = 180;

const BINANCE_INTERVALS: Array<{ interval: BinanceKlineInterval; ms: number }> = [
  { interval: "1m", ms: MINUTE_MS },
  { interval: "5m", ms: 5 * MINUTE_MS },
  { interval: "15m", ms: 15 * MINUTE_MS },
  { interval: "1h", ms: 60 * MINUTE_MS },
  { interval: "4h", ms: 4 * 60 * MINUTE_MS },
];

export function chooseKlineInterval(startTime: number, endTime: number): BinanceKlineInterval {
  const duration = Math.max(Math.abs(endTime - startTime), MINUTE_MS);
  return (
    BINANCE_INTERVALS.find(({ ms }) => Math.ceil(duration / ms) <= MAX_VISIBLE_CANDLES)
      ?.interval ?? "4h"
  );
}

export function buildKlineRequestWindow(startTime: number, endTime: number) {
  const safeStart = Math.min(startTime, endTime);
  const safeEnd = Math.max(startTime, endTime);
  const duration = Math.max(safeEnd - safeStart, MINUTE_MS);
  const padding = Math.max(Math.round(duration * 0.2), 5 * MINUTE_MS);
  const paddedStart = Math.max(0, safeStart - padding);
  const paddedEnd = safeEnd + padding;

  return {
    startTime: paddedStart,
    endTime: paddedEnd,
    interval: chooseKlineInterval(paddedStart, paddedEnd),
  };
}

function toFiniteNumber(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function parseBinanceKlines(rows: unknown): MarketCandle[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.flatMap((row) => {
    if (!Array.isArray(row)) {
      return [];
    }

    const time = toFiniteNumber(row[0]);
    const open = toFiniteNumber(row[1]);
    const high = toFiniteNumber(row[2]);
    const low = toFiniteNumber(row[3]);
    const close = toFiniteNumber(row[4]);

    if (time === null || open === null || high === null || low === null || close === null) {
      return [];
    }

    return [{ time, open, high, low, close }];
  });
}
