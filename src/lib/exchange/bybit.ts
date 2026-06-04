import ccxt from "ccxt";
import type { ExchangeCredentials, RawTrade, SyncResult } from "./types";

const BYBIT_CLOSE_PNL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const BYBIT_CLOSE_PNL_LIMIT = 100;
const BYBIT_EXECUTION_FEE_PADDING_MS = 5 * 60 * 1000;
const BYBIT_EXECUTION_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
const BYBIT_EXECUTION_LIMIT = 100;
const BYBIT_QTY_EPSILON = 1e-9;

interface BybitHistoricalPosition {
  symbol?: string;
  timestamp?: number;
  lastUpdateTimestamp?: number;
  side?: string;
  leverage?: number;
  entryPrice?: number;
  lastPrice?: number;
  contracts?: number;
  notional?: number;
  realizedPnl?: number;
  info?: Record<string, unknown>;
}

interface BybitExecutionFill {
  symbol?: string;
  timestamp?: number;
  amount?: number;
  takerOrMaker?: string;
  fee?: { cost?: number };
  info?: Record<string, unknown>;
}

interface BybitHistoryExchange {
  fetchPositionsHistory(
    symbols?: string[],
    since?: number,
    limit?: number,
    params?: Record<string, unknown>
  ): Promise<BybitHistoricalPosition[]>;
  fetchMyTrades(
    symbol?: string,
    since?: number,
    limit?: number,
    params?: Record<string, unknown>
  ): Promise<BybitExecutionFill[]>;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSymbol(symbol: string): string {
  return symbol.replace("/", "").replace(":USDT", "").replace(":USDC", "");
}

function quoteCoinForSymbol(symbol: string): string {
  if (symbol.endsWith("USDT")) return "USDT";
  if (symbol.endsWith("USDC")) return "USDC";
  if (symbol.endsWith("USD")) return "USD";
  return "USDT";
}

function bybitPositionSide(side?: string): "Long" | "Short" {
  const normalized = side?.toLowerCase();
  if (normalized === "short") return "Short";
  if (normalized === "buy") return "Short";
  return "Long";
}

function bybitUnifiedSymbol(symbol: string, quoteCoin: string): string {
  const baseCoin = symbol.endsWith(quoteCoin)
    ? symbol.slice(0, -quoteCoin.length)
    : symbol;
  return `${baseCoin}/${quoteCoin}:${quoteCoin}`;
}

async function fetchBybitClosedPositions(
  exchange: BybitHistoryExchange,
  sinceTs: number,
  untilTs: number
): Promise<BybitHistoricalPosition[]> {
  const positions: BybitHistoricalPosition[] = [];
  let windowStart = sinceTs;

  while (windowStart <= untilTs) {
    const windowEnd = Math.min(windowStart + BYBIT_CLOSE_PNL_WINDOW_MS, untilTs);
    const page = await exchange.fetchPositionsHistory(
      undefined,
      windowStart,
      BYBIT_CLOSE_PNL_LIMIT,
      { subType: "linear", until: windowEnd }
    );
    positions.push(...page);
    windowStart = windowEnd + 1;
  }

  return positions;
}

function summarizeBybitExecutionFees(
  fills: BybitExecutionFill[],
  symbol: string,
  windowStart: number,
  windowEnd: number
) {
  let makerFee = 0;
  let takerFee = 0;

  for (const fill of fills) {
    const fillTime = fill.timestamp;
    if (!fillTime || fillTime < windowStart || fillTime > windowEnd) continue;
    if (fill.symbol && normalizeSymbol(fill.symbol) !== symbol) continue;

    const feeCost = toFiniteNumber(fill.fee?.cost ?? fill.info?.execFee);
    const isMaker = fill.takerOrMaker === "maker" || fill.info?.isMaker === true;
    if (isMaker) {
      makerFee += feeCost;
    } else {
      takerFee += feeCost;
    }
  }

  return {
    fee: makerFee + takerFee,
    makerFee,
    takerFee,
  };
}

function bybitExecutionSide(fill: BybitExecutionFill): string {
  return String(fill.side ?? fill.info?.side ?? "").toLowerCase();
}

function bybitOpeningExecutionSide(positionSide: "Long" | "Short"): string {
  return positionSide === "Long" ? "buy" : "sell";
}

function deriveBybitEntryTimeFromExecutions(
  fills: BybitExecutionFill[],
  symbol: string,
  positionSide: "Long" | "Short",
  entryQty: number,
  exitTime: Date
): Date | null {
  if (entryQty <= BYBIT_QTY_EPSILON) return null;

  const openingSide = bybitOpeningExecutionSide(positionSide);
  const openingFills = fills
    .filter((fill) => {
      if (!fill.timestamp || fill.timestamp > exitTime.getTime()) {
        return false;
      }
      if (fill.symbol && normalizeSymbol(fill.symbol) !== symbol) return false;
      if (bybitExecutionSide(fill) !== openingSide) return false;

      const closedSize = toFiniteNumber(fill.info?.closedSize);
      return closedSize <= BYBIT_QTY_EPSILON;
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  let accumulatedQty = 0;
  let earliestTime: number | null = null;

  for (const fill of openingFills) {
    const amount = toFiniteNumber(fill.amount ?? fill.info?.execQty ?? fill.info?.qty);
    if (amount <= BYBIT_QTY_EPSILON) continue;

    accumulatedQty += amount;
    if (fill.timestamp) earliestTime = fill.timestamp;
    if (accumulatedQty >= entryQty - BYBIT_QTY_EPSILON) {
      return earliestTime ? new Date(earliestTime) : null;
    }
  }

  return null;
}

function bybitClosePnlFees(info: Record<string, unknown>) {
  const openFee = toFiniteNumber(info.openFee, Number.NaN);
  const closeFee = toFiniteNumber(info.closeFee, Number.NaN);
  const hasOpenFee = Number.isFinite(openFee);
  const hasCloseFee = Number.isFinite(closeFee);

  if (!hasOpenFee && !hasCloseFee) return null;

  const fee = (hasOpenFee ? openFee : 0) + (hasCloseFee ? closeFee : 0);
  return {
    fee,
    makerFee: 0,
    takerFee: fee,
  };
}

async function fetchBybitExecutionSummary(
  exchange: BybitHistoryExchange,
  symbol: string,
  quoteCoin: string,
  positionSide: "Long" | "Short",
  entryQty: number,
  fallbackEntryTime: Date,
  exitTime: Date
) {
  const windowStart = Math.max(0, exitTime.getTime() - BYBIT_EXECUTION_LOOKBACK_MS);
  const windowEnd = exitTime.getTime() + BYBIT_EXECUTION_FEE_PADDING_MS;
  const fills = await exchange.fetchMyTrades(
    bybitUnifiedSymbol(symbol, quoteCoin),
    windowStart,
    BYBIT_EXECUTION_LIMIT,
    {
      type: "swap",
      category: "linear",
      until: windowEnd,
      paginate: true,
    }
  );

  const entryTime = deriveBybitEntryTimeFromExecutions(
    fills,
    symbol,
    positionSide,
    entryQty,
    exitTime
  ) ?? fallbackEntryTime;
  const feeWindowStart = Math.max(0, entryTime.getTime() - BYBIT_EXECUTION_FEE_PADDING_MS);
  const fees = summarizeBybitExecutionFees(fills, symbol, feeWindowStart, windowEnd);

  return {
    ...fees,
    entryTime,
  };
}

/**
 * Fetch closed positions from Bybit.
 * Bybit execution fills do not contain enough entry/exit information to create
 * one journal row per closed position, so use the close-pnl history endpoint.
 */
export async function fetchBybitTrades(
  credentials: ExchangeCredentials,
  since?: Date
): Promise<RawTrade[]> {
  const exchange = new ccxt.bybit({
    apiKey: credentials.apiKey,
    secret: credentials.apiSecret,
    options: { defaultType: "swap" },
  }) as BybitHistoryExchange;

  const trades: RawTrade[] = [];
  const sinceTs = since ? since.getTime() : Date.now() - 90 * 24 * 60 * 60 * 1000;
  const untilTs = Date.now();

  const positions = await fetchBybitClosedPositions(exchange, sinceTs, untilTs);

  for (const position of positions) {
    const info = position.info || {};
    const symbol = normalizeSymbol(String(info.symbol || position.symbol || ""));
    if (!symbol) continue;

    const quoteCoin = quoteCoinForSymbol(symbol);
    const baseCoin = symbol.endsWith(quoteCoin)
      ? symbol.slice(0, -quoteCoin.length)
      : symbol;
    const entryPrice = toFiniteNumber(position.entryPrice ?? info.avgEntryPrice);
    const entryQty = toFiniteNumber(info.closedSize ?? info.qty ?? position.contracts);
    const entryValue = toFiniteNumber(info.cumEntryValue, entryPrice * entryQty);
    const exitPrice = toFiniteNumber(position.lastPrice ?? info.avgExitPrice);
    const exitQty = toFiniteNumber(info.closedSize ?? position.contracts ?? entryQty, entryQty);
    const exitValue = toFiniteNumber(info.cumExitValue ?? position.notional, exitPrice * exitQty);
    const realizedPnl = toFiniteNumber(position.realizedPnl ?? info.closedPnl);
    const fallbackEntryTime = new Date(toFiniteNumber(position.timestamp ?? info.createdTime, Date.now()));
    const exitTime = new Date(
      toFiniteNumber(position.lastUpdateTimestamp ?? info.updatedTime, fallbackEntryTime.getTime())
    );
    const side = bybitPositionSide(position.side ?? String(info.side || ""));
    const orderId = String(info.orderId || "");
    const updatedTime = String(info.updatedTime || position.lastUpdateTimestamp || exitTime.getTime());
    const executionSummary = await fetchBybitExecutionSummary(
      exchange,
      symbol,
      quoteCoin,
      side,
      entryQty,
      fallbackEntryTime,
      exitTime
    );
    const closePnlFees = bybitClosePnlFees(info);
    const fees = Math.abs(executionSummary.fee) > BYBIT_QTY_EPSILON
      ? executionSummary
      : closePnlFees ?? executionSummary;
    const entryTime = executionSummary.entryTime;

    trades.push({
      externalId: orderId
        ? `bybit_closed_pnl_${symbol}_${orderId}_${updatedTime}`
        : `bybit_closed_pnl_${symbol}_${entryTime.getTime()}_${exitTime.getTime()}_${entryQty}`,
      symbol,
      baseCoin,
      quoteCoin,
      side,
      leverage: toFiniteNumber(position.leverage, 1),
      marginMode: "cross",
      entryPrice,
      entryQty,
      entryValue,
      entryTime,
      exitPrice,
      exitQty,
      exitValue,
      exitTime,
      realizedPnl,
      fee: fees.fee,
      makerFee: fees.makerFee,
      takerFee: fees.takerFee,
      fundingFee: 0,
    });
  }

  return trades;
}

export async function syncBybit(
  credentials: ExchangeCredentials,
  since?: Date
): Promise<SyncResult> {
  try {
    const trades = await fetchBybitTrades(credentials, since);
    return { success: true, tradesAdded: trades.length };
  } catch (error) {
    return {
      success: false,
      tradesAdded: 0,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
