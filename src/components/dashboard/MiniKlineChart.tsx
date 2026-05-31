"use client";

import { useEffect, useId, useMemo, useState } from "react";
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
const CHART_HEIGHT = 276;
const PLOT_LEFT = 18;
const PLOT_RIGHT = 78;
const PLOT_TOP = 24;
const PLOT_BOTTOM = 30;
const UP_COLOR = "#22ab94";
const DOWN_COLOR = "#ef5350";
const GRID_COLOR = "#243247";
const CHART_BG = "#0b111d";

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

function MarkerShape({
  label,
  x,
  y,
}: {
  label: "B" | "S";
  x: number;
  y: number;
}) {
  const fill = label === "B" ? UP_COLOR : DOWN_COLOR;
  const boxY = label === "B" ? 8 : -24;
  const pointerPath = label === "B"
    ? "M 0 1 L -5 8 L 5 8 Z"
    : "M 0 -1 L -5 -8 L 5 -8 Z";

  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d={pointerPath} fill={fill} />
      <rect x="-11" y={boxY} width="22" height="16" rx="4" fill={fill} />
      <text
        x="0"
        y={boxY + 11.5}
        textAnchor="middle"
        className="fill-[#061018] font-mono text-[10px] font-bold"
      >
        {label}
      </text>
    </g>
  );
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
  const rawGridId = useId();
  const gridId = `mini-kline-grid-${rawGridId.replace(/:/g, "")}`;
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
    const candleWidth = Math.max(2.5, Math.min(7, candleGap * 0.52));
    const entryIndex = nearestCandleIndex(activeState.candles, entryMs);
    const exitIndex = nearestCandleIndex(activeState.candles, exitMs);
    const lastClose = activeState.candles.at(-1)?.close ?? exitPrice;

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
      lastClose,
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
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#263448] bg-[#0d1422] px-3 py-2">
        <span className="font-mono text-xs font-semibold text-text-primary">
          {symbol}
        </span>
        <span className="text-xs font-medium text-text-muted">·</span>
        <span className="text-xs font-medium text-text-secondary">
          {activeState.interval || "Real"} · Binance Futures
        </span>
        <span className="flex w-full items-center gap-2 text-xs font-medium text-text-secondary sm:ml-auto sm:w-auto">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: UP_COLOR }} />
            B
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DOWN_COLOR }} />
            S
          </span>
        </span>
      </div>

      {!chart ? (
        <div className={`flex h-[276px] w-full items-center justify-center rounded-lg border border-[#263448] bg-[#0b111d] ${activeState.loading ? "animate-pulse" : ""}`}>
          <div className="text-center">
            <div className="text-xs font-semibold text-text-secondary" role="status">{placeholderTitle}</div>
            <div className="mt-1 max-w-md text-xs font-medium text-text-muted">{placeholderMessage}</div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg border border-[#263448]" style={{ backgroundColor: CHART_BG }}>
          <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-1.5">
            <span
              title="Most Favorable Excursion: best market price reached inside the loaded candle window."
              className="rounded bg-[#121b2b]/90 px-2 py-1 font-mono text-[10px] font-semibold text-text-secondary ring-1 ring-[#27364b]"
            >
              MFE {formatChartPrice(chart.mfePrice)}
            </span>
            <span
              title="Maximum Adverse Excursion: worst market price reached inside the loaded candle window."
              className="rounded bg-[#121b2b]/90 px-2 py-1 font-mono text-[10px] font-semibold text-text-secondary ring-1 ring-[#27364b]"
            >
              MAE {formatChartPrice(chart.maePrice)}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-[276px] w-full overflow-visible"
            role="img"
            aria-label={`${symbol} ${side} trade real candlestick summary with ${entryMarker} and ${exitMarker} markers`}
          >
            <defs>
              <pattern id={gridId} width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke={GRID_COLOR} strokeWidth="1" opacity="0.22" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} fill={CHART_BG} />
            <rect
              x={PLOT_LEFT}
              y={PLOT_TOP}
              width={chart.plotWidth}
              height={chart.plotHeight}
              fill={`url(#${gridId})`}
            />
            {Array.from({ length: 5 }, (_, i) => (
              <line
                key={`vertical-${i}`}
                x1={PLOT_LEFT + (chart.plotWidth * i) / 4}
                x2={PLOT_LEFT + (chart.plotWidth * i) / 4}
                y1={PLOT_TOP}
                y2={CHART_HEIGHT - PLOT_BOTTOM}
                stroke={GRID_COLOR}
                strokeDasharray="3 6"
                strokeOpacity="0.35"
              />
            ))}
            {chart.yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PLOT_LEFT}
                  x2={CHART_WIDTH - PLOT_RIGHT}
                  y1={chart.yForPrice(tick)}
                  y2={chart.yForPrice(tick)}
                  stroke={GRID_COLOR}
                  strokeDasharray="3 6"
                  strokeOpacity="0.55"
                />
                <text
                  x={CHART_WIDTH - PLOT_RIGHT + 12}
                  y={chart.yForPrice(tick) + 3}
                  textAnchor="start"
                  className="fill-[#6f7d90] font-mono text-[10px] font-medium"
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
              stroke={entryMarker === "B" ? UP_COLOR : DOWN_COLOR}
              strokeDasharray="4 7"
              strokeOpacity="0.55"
              strokeWidth="1"
            />
            <line
              x1={PLOT_LEFT}
              x2={CHART_WIDTH - PLOT_RIGHT}
              y1={chart.yForPrice(exitPrice)}
              y2={chart.yForPrice(exitPrice)}
              stroke={exitMarker === "B" ? UP_COLOR : DOWN_COLOR}
              strokeDasharray="4 7"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <line
              x1={PLOT_LEFT}
              x2={CHART_WIDTH - PLOT_RIGHT}
              y1={chart.yForPrice(chart.lastClose)}
              y2={chart.yForPrice(chart.lastClose)}
              stroke="#7b8798"
              strokeDasharray="2 5"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            {activeState.candles.map((candle, index) => {
              const bullish = candle.close >= candle.open;
              const color = bullish ? UP_COLOR : DOWN_COLOR;
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
                    strokeOpacity="0.9"
                    strokeWidth="1.25"
                  />
                  <rect
                    x={x - chart.candleWidth / 2}
                    y={bodyTop}
                    width={chart.candleWidth}
                    height={bodyHeight}
                    fill={bullish ? color : "transparent"}
                    stroke={color}
                    strokeWidth="1"
                    rx="0.5"
                  />
                </g>
              );
            })}
            <text
              x={CHART_WIDTH - PLOT_RIGHT + 12}
              y={chart.yForPrice(entryPrice) + 3}
              textAnchor="start"
              fill={entryMarker === "B" ? UP_COLOR : DOWN_COLOR}
              className="font-mono text-[10px] font-bold"
            >
              {entryMarker}
            </text>
            <text
              x={CHART_WIDTH - PLOT_RIGHT + 12}
              y={chart.yForPrice(exitPrice) + 3}
              textAnchor="start"
              fill={exitMarker === "B" ? UP_COLOR : DOWN_COLOR}
              className="font-mono text-[10px] font-bold"
            >
              {exitMarker}
            </text>
            <MarkerShape
              label={entryMarker}
              x={chart.xForIndex(chart.entryIndex)}
              y={chart.yForPrice(entryPrice)}
            />
            <MarkerShape
              label={exitMarker}
              x={chart.xForIndex(chart.exitIndex)}
              y={chart.yForPrice(exitPrice)}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
