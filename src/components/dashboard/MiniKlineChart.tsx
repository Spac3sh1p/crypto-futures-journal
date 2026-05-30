"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketCandle } from "@/lib/market/klines";

interface MiniKlineChartProps {
  exchangeName: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  side: string;
}

interface KlineApiResponse {
  success: boolean;
  data?: {
    candles: MarketCandle[];
    interval: string;
  };
  message?: string;
}

interface KlineState {
  requestKey: string | null;
  candles: MarketCandle[];
  interval: string | null;
  loading: boolean;
  message: string | null;
}

const CHART_WIDTH = 920;
const CHART_HEIGHT = 280;
const PLOT_LEFT = 56;
const PLOT_RIGHT = 24;
const PLOT_TOP = 20;
const PLOT_BOTTOM = 32;

function markerLabel(side: string, phase: "entry" | "exit"): "B" | "S" {
  if (side === "Short") {
    return phase === "entry" ? "S" : "B";
  }
  return phase === "entry" ? "B" : "S";
}

function nearestCandleIndex(candles: MarketCandle[], targetTime: number): number {
  if (!Number.isFinite(targetTime)) {
    return 0;
  }

  return candles.reduce((bestIndex, candle, index) => {
    const bestDistance = Math.abs(candles[bestIndex].time - targetTime);
    const distance = Math.abs(candle.time - targetTime);
    return distance < bestDistance ? index : bestIndex;
  }, 0);
}

function formatChartPrice(price: number): string {
  const absPrice = Math.abs(price);
  if (absPrice >= 100) return `$${price.toFixed(2)}`;
  if (absPrice >= 1) return `$${price.toFixed(3)}`;
  if (absPrice >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toPrecision(4)}`;
}

export function MiniKlineChart({
  exchangeName,
  symbol,
  entryPrice,
  exitPrice,
  entryTime,
  exitTime,
  side,
}: MiniKlineChartProps) {
  const normalizedExchange = exchangeName.toLowerCase();
  const entryMs = Date.parse(entryTime);
  const exitMs = Date.parse(exitTime);
  const validationMessage =
    normalizedExchange !== "binance"
      ? "Real candles for this exchange are not supported yet."
      : !symbol || !Number.isFinite(entryMs) || !Number.isFinite(exitMs)
        ? "Trade time or symbol is invalid."
        : null;
  const requestKey = validationMessage
    ? null
    : `${normalizedExchange}:${symbol}:${entryMs}:${exitMs}`;
  const [state, setState] = useState<KlineState>({
    requestKey: null,
    candles: [],
    interval: null,
    loading: true,
    message: null,
  });

  useEffect(() => {
    if (validationMessage) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      exchange: normalizedExchange,
      symbol,
      startTime: String(entryMs),
      endTime: String(exitMs),
    });

    async function loadKlines() {
      try {
        await Promise.resolve();
        if (controller.signal.aborted) {
          return;
        }
        setState({ requestKey, candles: [], interval: null, loading: true, message: null });

        const response = await fetch(`/api/market/klines?${params}`, {
          signal: controller.signal,
        });
        const json = (await response.json()) as KlineApiResponse;

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Market candles request failed.");
        }

        const candles = json.data?.candles ?? [];
        setState({
          requestKey,
          candles,
          interval: json.data?.interval ?? null,
          loading: false,
          message: candles.length > 0 ? null : "Binance returned no candles for this trade window.",
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setState({
          requestKey,
          candles: [],
          interval: null,
          loading: false,
          message: error instanceof Error ? error.message : "Failed to load real market candles.",
        });
      }
    }

    void loadKlines();
    return () => controller.abort();
  }, [entryMs, exitMs, normalizedExchange, requestKey, symbol, validationMessage]);

  const activeState: KlineState = validationMessage
    ? {
        requestKey: null,
        candles: [],
        interval: null,
        loading: false,
        message: validationMessage,
      }
    : state.requestKey === requestKey
      ? state
      : {
          requestKey,
          candles: [],
          interval: null,
          loading: true,
          message: null,
        };

  const chart = useMemo(() => {
    if (activeState.candles.length === 0) {
      return null;
    }

    const prices = activeState.candles.flatMap((d) => [d.high, d.low]);
    const maePrice = side === "Long" ? Math.min(...prices) : Math.max(...prices);
    const mfePrice = side === "Long" ? Math.max(...prices) : Math.min(...prices);
    const minPrice = Math.min(...prices, entryPrice, exitPrice);
    const maxPrice = Math.max(...prices, entryPrice, exitPrice);
    const yPadding = Math.max((maxPrice - minPrice) * 0.12, Math.abs(entryPrice) * 0.001, 0.0001);
    const minY = minPrice - yPadding;
    const maxY = maxPrice + yPadding;
    const plotWidth = CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT;
    const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
    const candleGap = plotWidth / activeState.candles.length;
    const candleWidth = Math.max(3, Math.min(9, candleGap * 0.58));
    const entryIndex = nearestCandleIndex(activeState.candles, entryMs);
    const exitIndex = nearestCandleIndex(activeState.candles, exitMs);

    const xForIndex = (index: number) => PLOT_LEFT + candleGap * index + candleGap / 2;
    const yForPrice = (price: number) =>
      PLOT_TOP + ((maxY - price) / (maxY - minY)) * plotHeight;
    const yTicks = Array.from({ length: 5 }, (_, i) => minY + ((maxY - minY) * i) / 4).reverse();

    return {
      candleWidth,
      entryIndex,
      exitIndex,
      maePrice,
      mfePrice,
      plotHeight,
      plotWidth,
      xForIndex,
      yForPrice,
      yTicks,
    };
  }, [activeState.candles, entryMs, entryPrice, exitMs, exitPrice, side]);

  const entryMarker = markerLabel(side, "entry");
  const exitMarker = markerLabel(side, "exit");
  const placeholderTitle = activeState.loading ? "Loading real market candles" : "No real market candles loaded";
  const placeholderMessage = activeState.loading
    ? "Waiting for Binance futures kline data."
    : activeState.message || "The chart is hidden until real exchange candles are available.";

  return (
    <div className="relative">
      <div className="mb-2 flex items-center gap-4">
        <select
          disabled
          className="rounded border border-border bg-bg-tertiary px-2 py-1 text-xs font-medium text-text-secondary"
        >
          <option>{activeState.interval ? `${activeState.interval} Real Candles` : "Real Candles"}</option>
        </select>
        <span className="text-xs font-medium text-text-secondary">Full Screen</span>
        <span className="ml-auto text-xs font-medium text-text-secondary">Filter</span>
      </div>

      {!chart ? (
        <div className="flex h-[280px] w-full items-center justify-center rounded border border-blue bg-blue-dim/20">
          <div className="text-center">
            <div className="text-xs font-semibold text-text-secondary">{placeholderTitle}</div>
            <div className="mt-1 max-w-md text-xs font-medium text-text-muted">{placeholderMessage}</div>
          </div>
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-[280px] w-full overflow-visible rounded border border-blue bg-blue-dim/20"
            role="img"
            aria-label={`${side} trade real candlestick summary with ${entryMarker} and ${exitMarker} markers`}
          >
            <defs>
              <pattern id="mini-kline-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#2b3139" strokeWidth="1" opacity="0.55" />
              </pattern>
            </defs>
            <rect
              x={PLOT_LEFT}
              y={PLOT_TOP}
              width={chart.plotWidth}
              height={chart.plotHeight}
              fill="url(#mini-kline-grid)"
            />
            {chart.yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PLOT_LEFT}
                  x2={CHART_WIDTH - PLOT_RIGHT}
                  y1={chart.yForPrice(tick)}
                  y2={chart.yForPrice(tick)}
                  stroke="#2b3139"
                  strokeDasharray="4 4"
                />
                <text
                  x={PLOT_LEFT - 10}
                  y={chart.yForPrice(tick) + 3}
                  textAnchor="end"
                  className="fill-text-muted font-mono text-[10px]"
                >
                  {formatChartPrice(tick)}
                </text>
              </g>
            ))}
            <line
              x1={PLOT_LEFT}
              x2={CHART_WIDTH - PLOT_RIGHT}
              y1={chart.yForPrice(entryPrice)}
              y2={chart.yForPrice(entryPrice)}
              stroke="#f0b90b"
              strokeDasharray="5 5"
              strokeWidth="1"
            />
            {activeState.candles.map((candle, index) => {
              const bullish = candle.close >= candle.open;
              const color = bullish ? "#0ecb81" : "#f6465d";
              const x = chart.xForIndex(index);
              const openY = chart.yForPrice(candle.open);
              const closeY = chart.yForPrice(candle.close);
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

              return (
                <g key={`${candle.time}-${index}`}>
                  <line
                    x1={x}
                    x2={x}
                    y1={chart.yForPrice(candle.high)}
                    y2={chart.yForPrice(candle.low)}
                    stroke={color}
                    strokeWidth="1.4"
                  />
                  <rect
                    x={x - chart.candleWidth / 2}
                    y={bodyTop}
                    width={chart.candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })}
            <g transform={`translate(${chart.xForIndex(chart.entryIndex)}, ${chart.yForPrice(entryPrice)})`}>
              <circle r="9" fill={entryMarker === "B" ? "#0ecb81" : "#f6465d"} />
              <text textAnchor="middle" y="3.5" className="fill-bg-primary font-mono text-[10px] font-bold">
                {entryMarker}
              </text>
            </g>
            <g transform={`translate(${chart.xForIndex(chart.exitIndex)}, ${chart.yForPrice(exitPrice)})`}>
              <circle r="9" fill={exitMarker === "B" ? "#0ecb81" : "#f6465d"} />
              <text textAnchor="middle" y="3.5" className="fill-bg-primary font-mono text-[10px] font-bold">
                {exitMarker}
              </text>
            </g>
          </svg>
          <div className="absolute left-20 top-8 text-[10px] font-medium text-text-secondary">
            MFE {formatChartPrice(chart.mfePrice)}
          </div>
          <div className="absolute bottom-16 left-20 text-[10px] font-medium text-text-secondary">
            MAE {formatChartPrice(chart.maePrice)}
          </div>
        </>
      )}
    </div>
  );
}
