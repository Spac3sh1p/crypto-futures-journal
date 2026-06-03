export type BinanceKlineInterval = "1m" | "5m" | "15m" | "1h" | "4h";
export type BybitKlineInterval = "1" | "5" | "15" | "60" | "240";

export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const MAX_VISIBLE_CANDLES = 180;
const MIN_CONTEXT_MS = 30 * MINUTE_MS;
const MAX_CONTEXT_MS = 12 * HOUR_MS;

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

function chooseContextPadding(duration: number): number {
  if (duration <= MIN_CONTEXT_MS) {
    return MIN_CONTEXT_MS;
  }

  if (duration <= 6 * HOUR_MS) {
    return duration;
  }

  return Math.min(Math.round(duration * 0.35), MAX_CONTEXT_MS);
}

export function buildKlineRequestWindow(startTime: number, endTime: number) {
  const safeStart = Math.min(startTime, endTime);
  const safeEnd = Math.max(startTime, endTime);
  const duration = Math.max(safeEnd - safeStart, MINUTE_MS);
  const padding = chooseContextPadding(duration);
  const paddedStart = Math.max(0, safeStart - padding);
  const paddedEnd = safeEnd + padding;

  return {
    startTime: paddedStart,
    endTime: paddedEnd,
    interval: chooseKlineInterval(paddedStart, paddedEnd),
  };
}

export function candlesInTradeWindow(
  candles: MarketCandle[],
  entryTime: number,
  exitTime: number
): MarketCandle[] {
  const safeStart = Math.min(entryTime, exitTime);
  const safeEnd = Math.max(entryTime, exitTime);
  const intervalMs = inferCandleInterval(candles);
  const heldCandles = candles.filter((candle) =>
    candle.time <= safeEnd && candle.time + intervalMs > safeStart
  );

  if (heldCandles.length > 0) {
    return heldCandles;
  }

  const startIndex = nearestCandleIndex(candles, safeStart);
  const endIndex = nearestCandleIndex(candles, safeEnd);
  return candles.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
}

function inferCandleInterval(candles: MarketCandle[]): number {
  const diffs = candles
    .slice(1)
    .map((candle, index) => candle.time - candles[index].time)
    .filter((diff) => diff > 0);

  return diffs.length > 0 ? Math.min(...diffs) : MINUTE_MS;
}

export function nearestCandleIndex(candles: MarketCandle[], targetTime: number): number {
  if (!Number.isFinite(targetTime) || candles.length === 0) {
    return 0;
  }

  return candles.reduce((bestIndex, candle, index) => {
    const bestDistance = Math.abs(candles[bestIndex].time - targetTime);
    const distance = Math.abs(candle.time - targetTime);
    return distance < bestDistance ? index : bestIndex;
  }, 0);
}

export function calculateTradeExcursion(
  candles: MarketCandle[],
  {
    entryPrice,
    entryTime,
    exitTime,
    side,
  }: {
    entryPrice: number;
    entryTime: number;
    exitTime: number;
    side: string;
  }
) {
  const heldCandles = candlesInTradeWindow(candles, entryTime, exitTime);
  const prices = heldCandles.length > 0
    ? heldCandles.flatMap((d) => [d.high, d.low])
    : [entryPrice];
  const maePrice = side === "Long" ? Math.min(...prices) : Math.max(...prices);
  const mfePrice = side === "Long" ? Math.max(...prices) : Math.min(...prices);
  const mfePercent = side === "Long"
    ? ((mfePrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - mfePrice) / entryPrice) * 100;
  const maePercent = side === "Long"
    ? ((maePrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - maePrice) / entryPrice) * 100;

  return {
    maePercent,
    maePrice,
    mfePercent,
    mfePrice,
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

export function bybitIntervalForKlineInterval(interval: BinanceKlineInterval): BybitKlineInterval {
  switch (interval) {
    case "1m":
      return "1";
    case "5m":
      return "5";
    case "15m":
      return "15";
    case "1h":
      return "60";
    case "4h":
      return "240";
  }
}

export function parseBybitKlines(response: unknown): MarketCandle[] {
  const rows = response && typeof response === "object" && "result" in response
    ? (response as { result?: { list?: unknown } }).result?.list
    : null;

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .flatMap((row) => {
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
    })
    .sort((a, b) => a.time - b.time);
}
