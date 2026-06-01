"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { MarketCandle } from "@/lib/market/klines";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";

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
const PLOT_RIGHT = 92;
const PLOT_TOP = 18;
const PLOT_BOTTOM = 26;
const UP_COLOR = "#22ab94";
const DOWN_COLOR = "#ef5350";
const GRID_MAJOR = "#263247";
const GRID_MINOR = "#182235";
const CHART_BG = "#080f1b";
const PRICE_SCALE_BG = "#0c1422";
const AXIS_TEXT = "#7b8798";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

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

function formatExcursionPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function MarkerShape({
  label,
  x,
  y,
  plotTop,
  plotBottom,
}: {
  label: "B" | "S";
  x: number;
  y: number;
  plotTop: number;
  plotBottom: number;
}) {
  const fill = label === "B" ? UP_COLOR : DOWN_COLOR;
  const bubbleY = clamp(y + (label === "B" ? 10 : -28), plotTop + 2, plotBottom - 20);
  const connectorEndY = label === "B" ? bubbleY : bubbleY + 18;

  return (
    <g>
      <line
        x1={x}
        x2={x}
        y1={y}
        y2={connectorEndY}
        stroke={fill}
        strokeWidth="1"
        strokeOpacity="0.75"
      />
      <rect x={x - 10} y={bubbleY} width="20" height="18" rx="3" fill={fill} />
      <text
        x={x}
        y={bubbleY + 12.5}
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
  const { dictionary } = useI18n();
  const text = dictionary.miniKline;
  const rawSvgId = useId().replace(/:/g, "");
  const clipId = `mini-kline-clip-${rawSvgId}`;
  const normalizedExchange = exchangeName.toLowerCase();
  const entryMs = Date.parse(entryTime);
  const exitMs = Date.parse(exitTime);
  const validationMessage =
    normalizedExchange !== "binance"
      ? text.unsupportedExchange
      : !symbol || !Number.isFinite(entryMs) || !Number.isFinite(exitMs)
        ? text.invalidTrade
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
          throw new Error(json.message || text.requestFailed);
        }

        const candles = json.data?.candles ?? [];
        setState({
          requestKey,
          candles,
          interval: json.data?.interval ?? null,
          loading: false,
          message: candles.length > 0 ? null : text.emptyCandles,
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
          message: error instanceof Error ? error.message : text.failed,
        });
      }
    }

    void loadKlines();
    return () => controller.abort();
  }, [entryMs, exitMs, normalizedExchange, requestKey, symbol, text.emptyCandles, text.failed, text.requestFailed, validationMessage]);

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
    const mfePercent = side === "Long"
      ? ((mfePrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - mfePrice) / entryPrice) * 100;
    const maePercent = side === "Long"
      ? ((maePrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - maePrice) / entryPrice) * 100;
    const minPrice = Math.min(...prices, entryPrice, exitPrice);
    const maxPrice = Math.max(...prices, entryPrice, exitPrice);
    const yPadding = Math.max((maxPrice - minPrice) * 0.12, Math.abs(entryPrice) * 0.001, 0.0001);
    const minY = minPrice - yPadding;
    const maxY = maxPrice + yPadding;
    const plotWidth = CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT;
    const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
    const candleGap = plotWidth / activeState.candles.length;
    const candleWidth = Math.max(2, Math.min(9, candleGap * 0.62));
    const entryIndex = nearestCandleIndex(activeState.candles, entryMs);
    const exitIndex = nearestCandleIndex(activeState.candles, exitMs);
    const lastClose = activeState.candles.at(-1)?.close ?? exitPrice;

    const xForIndex = (index: number) => PLOT_LEFT + candleGap * index + candleGap / 2;
    const yForPrice = (price: number) =>
      PLOT_TOP + ((maxY - price) / (maxY - minY)) * plotHeight;
    const yTicks = Array.from({ length: 6 }, (_, i) => minY + ((maxY - minY) * i) / 5).reverse();
    const minorYTicks = Array.from({ length: 11 }, (_, i) => minY + ((maxY - minY) * i) / 10).reverse();
    const xGridTicks = Array.from({ length: 7 }, (_, i) => PLOT_LEFT + (plotWidth * i) / 6);
    const plotRightX = CHART_WIDTH - PLOT_RIGHT;

    return {
      candleWidth,
      entryIndex,
      exitIndex,
      maePrice,
      maePercent,
      mfePrice,
      mfePercent,
      lastClose,
      plotHeight,
      plotWidth,
      plotRightX,
      xForIndex,
      xGridTicks,
      minorYTicks,
      yForPrice,
      yTicks,
    };
  }, [activeState.candles, entryMs, entryPrice, exitMs, exitPrice, side]);

  const entryMarker = markerLabel(side, "entry");
  const exitMarker = markerLabel(side, "exit");
  const placeholderTitle = activeState.loading ? text.loadingTitle : text.emptyTitle;
  const placeholderMessage = activeState.loading
    ? text.loadingMessage
    : activeState.message || text.emptyMessage;

  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#263448] bg-[#0d1422] px-3 py-2">
        <span className="font-mono text-xs font-semibold text-text-primary">
          {symbol}
        </span>
        <span className="text-xs font-medium text-text-muted">/</span>
        <span className="text-xs font-medium text-text-secondary">
          {activeState.interval || text.real} / {text.futures}
        </span>
        {chart && (
          <span className="flex w-full flex-wrap items-center gap-1.5 text-xs font-medium text-text-secondary sm:ml-auto sm:w-auto">
            <span
              title={template(text.mfeTitle, { price: formatChartPrice(chart.mfePrice) })}
              className="rounded-md bg-[#121b2b] px-2 py-1 font-mono text-[10px] font-semibold text-text-secondary ring-1 ring-[#27364b]"
            >
              MFE {formatExcursionPercent(chart.mfePercent)}
            </span>
            <span
              title={template(text.maeTitle, { price: formatChartPrice(chart.maePrice) })}
              className="rounded-md bg-[#121b2b] px-2 py-1 font-mono text-[10px] font-semibold text-text-secondary ring-1 ring-[#27364b]"
            >
              MAE {formatExcursionPercent(chart.maePercent)}
            </span>
          </span>
        )}
        <span className="flex w-full items-center gap-2 text-xs font-medium text-text-secondary sm:w-auto">
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
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-[276px] w-full overflow-visible"
            shapeRendering="geometricPrecision"
            role="img"
            aria-label={template(text.aria, {
              symbol,
              side: side === "Long" ? dictionary.common.long : dictionary.common.short,
              entry: entryMarker,
              exit: exitMarker,
            })}
          >
            <defs>
              <clipPath id={clipId}>
                <rect
                  x={PLOT_LEFT}
                  y={PLOT_TOP}
                  width={chart.plotWidth}
                  height={chart.plotHeight}
                />
              </clipPath>
            </defs>
            <rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} fill={CHART_BG} />
            <rect
              x={chart.plotRightX}
              y="0"
              width={PLOT_RIGHT}
              height={CHART_HEIGHT}
              fill={PRICE_SCALE_BG}
            />
            <rect
              x={PLOT_LEFT}
              y={PLOT_TOP}
              width={chart.plotWidth}
              height={chart.plotHeight}
              fill="transparent"
            />
            {chart.xGridTicks.map((x) => (
              <line
                key={`vertical-${x}`}
                x1={x}
                x2={x}
                y1={PLOT_TOP}
                y2={CHART_HEIGHT - PLOT_BOTTOM}
                stroke={GRID_MAJOR}
                strokeWidth="1"
                strokeOpacity="0.34"
              />
            ))}
            {chart.minorYTicks.map((tick) => (
              <line
                key={`minor-${tick}`}
                x1={PLOT_LEFT}
                x2={chart.plotRightX}
                y1={chart.yForPrice(tick)}
                y2={chart.yForPrice(tick)}
                stroke={GRID_MINOR}
                strokeWidth="1"
                strokeOpacity="0.5"
              />
            ))}
            {chart.yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PLOT_LEFT}
                  x2={chart.plotRightX}
                  y1={chart.yForPrice(tick)}
                  y2={chart.yForPrice(tick)}
                  stroke={GRID_MAJOR}
                  strokeWidth="1"
                  strokeOpacity="0.72"
                />
                <text
                  x={chart.plotRightX + 12}
                  y={chart.yForPrice(tick) + 3}
                  textAnchor="start"
                  fill={AXIS_TEXT}
                  className="font-mono text-[10px] font-medium"
                >
                  {formatChartPrice(tick)}
                </text>
              </g>
            ))}
            <line
              x1={PLOT_LEFT}
              x2={chart.plotRightX}
              y1={chart.yForPrice(entryPrice)}
              y2={chart.yForPrice(entryPrice)}
              stroke={entryMarker === "B" ? UP_COLOR : DOWN_COLOR}
              strokeDasharray="4 7"
              strokeOpacity="0.55"
              strokeWidth="1"
            />
            <line
              x1={PLOT_LEFT}
              x2={chart.plotRightX}
              y1={chart.yForPrice(exitPrice)}
              y2={chart.yForPrice(exitPrice)}
              stroke={exitMarker === "B" ? UP_COLOR : DOWN_COLOR}
              strokeDasharray="4 7"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <line
              x1={PLOT_LEFT}
              x2={chart.plotRightX}
              y1={chart.yForPrice(chart.lastClose)}
              y2={chart.yForPrice(chart.lastClose)}
              stroke="#7b8798"
              strokeDasharray="2 5"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <g clipPath={`url(#${clipId})`}>
              {activeState.candles.map((candle, index) => {
                const bullish = candle.close >= candle.open;
                const color = bullish ? UP_COLOR : DOWN_COLOR;
                const x = chart.xForIndex(index);
                const openY = chart.yForPrice(candle.open);
                const closeY = chart.yForPrice(candle.close);
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(Math.abs(closeY - openY), 1.4);

                return (
                  <g key={`${candle.time}-${index}`}>
                    <line
                      x1={x}
                      x2={x}
                      y1={chart.yForPrice(candle.high)}
                      y2={chart.yForPrice(candle.low)}
                      stroke={color}
                      strokeOpacity="0.95"
                      strokeWidth="1.35"
                    />
                    <rect
                      x={x - chart.candleWidth / 2}
                      y={bodyTop}
                      width={chart.candleWidth}
                      height={bodyHeight}
                      fill={color}
                      stroke={color}
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </g>
            <line
              x1={chart.plotRightX}
              x2={chart.plotRightX}
              y1="0"
              y2={CHART_HEIGHT}
              stroke={GRID_MAJOR}
              strokeOpacity="0.9"
            />
            <rect
              x={chart.plotRightX + 8}
              y={clamp(chart.yForPrice(chart.lastClose) - 8, PLOT_TOP, CHART_HEIGHT - PLOT_BOTTOM - 16)}
              width="72"
              height="16"
              rx="3"
              fill="#111c2d"
              stroke="#344155"
              strokeOpacity="0.9"
            />
            <text
              x={chart.plotRightX + 44}
              y={clamp(chart.yForPrice(chart.lastClose) + 3.5, PLOT_TOP + 11, CHART_HEIGHT - PLOT_BOTTOM - 4)}
              textAnchor="middle"
              fill="#c4d0df"
              className="font-mono text-[10px] font-semibold"
            >
              {formatChartPrice(chart.lastClose)}
            </text>
            <text
              x={chart.plotRightX + 13}
              y={chart.yForPrice(entryPrice) + 3}
              textAnchor="start"
              fill={entryMarker === "B" ? UP_COLOR : DOWN_COLOR}
              className="font-mono text-[10px] font-bold"
            >
              {entryMarker}
            </text>
            <text
              x={chart.plotRightX + 13}
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
              plotTop={PLOT_TOP}
              plotBottom={CHART_HEIGHT - PLOT_BOTTOM}
            />
            <MarkerShape
              label={exitMarker}
              x={chart.xForIndex(chart.exitIndex)}
              y={chart.yForPrice(exitPrice)}
              plotTop={PLOT_TOP}
              plotBottom={CHART_HEIGHT - PLOT_BOTTOM}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
