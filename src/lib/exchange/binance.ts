import ccxt from "ccxt";
import type { ExchangeCredentials, RawAccountFlow, RawTrade, SyncResult } from "./types";

interface BinanceMarket {
  id?: string;
  symbol?: string;
  linear?: boolean;
  swap?: boolean;
  active?: boolean;
  quote?: string;
  settle?: string;
}

interface BinanceIncomeRow {
  symbol?: string;
  incomeType?: string;
  income?: number | string;
  asset?: string;
  info?: string;
  time?: number | string;
  tranId?: number | string;
  tradeId?: number | string;
}

interface BinanceFill {
  id?: string;
  order?: string;
  symbol?: string;
  timestamp?: number;
  price?: number;
  amount?: number;
  side?: string;
  takerOrMaker?: string;
  fee?: { cost?: number };
  info?: Record<string, unknown>;
}

interface BinanceExchangeClient {
  loadMarkets(): Promise<Record<string, BinanceMarket>>;
  fetchMyTrades(
    symbol: string,
    since?: number,
    limit?: number,
    params?: Record<string, unknown>
  ): Promise<BinanceFill[]>;
  fapiPrivateGetIncome(params: Record<string, unknown>): Promise<BinanceIncomeRow[]>;
  markets_by_id?: Record<string, BinanceMarket | BinanceMarket[]>;
}

type UsdtLinearSwapMarket = BinanceMarket & { symbol: string };
type TradeSide = "Long" | "Short";
type OrderSide = "buy" | "sell";

interface BinanceOrderGroup {
  externalId: string;
  orderKey: string;
  symbol: string;
  baseCoin: string;
  orderSide: OrderSide;
  quantity: number;
  value: number;
  realizedPnl: number;
  fee: number;
  makerFee: number;
  takerFee: number;
  firstTime: Date;
  lastTime: Date;
}

interface BinancePosition {
  symbol: string;
  baseCoin: string;
  side: TradeSide;
  firstOrderKey: string;
  lastOrderKey: string;
  entryQty: number;
  entryValue: number;
  exitQty: number;
  exitValue: number;
  remainingQty: number;
  realizedPnl: number;
  fee: number;
  makerFee: number;
  takerFee: number;
  firstTime: Date;
  lastTime: Date;
}

const INCOME_PAGE_LIMIT = 1000;
const MAX_INCOME_PAGES = 10;
const MAX_INCOME_WINDOW_MS = 89 * 24 * 60 * 60 * 1000;
const BINANCE_DEFAULT_TRADE_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
const BINANCE_POSITION_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
const POSITION_QTY_EPSILON = 1e-9;

function isUsdtLinearSwapMarket(market: BinanceMarket | undefined): market is UsdtLinearSwapMarket {
  return !!market?.symbol && market.linear === true && market.swap === true && market.quote === "USDT";
}

function firstMatchingMarket(markets: BinanceMarket | BinanceMarket[] | undefined): BinanceMarket | undefined {
  const candidates = Array.isArray(markets) ? markets : markets ? [markets] : [];
  return candidates.find(isUsdtLinearSwapMarket);
}

function marketSymbolFromId(
  exchange: BinanceExchangeClient,
  markets: Record<string, BinanceMarket>,
  marketId: string
): string | null {
  const fromId = firstMatchingMarket(exchange.markets_by_id?.[marketId]);
  if (fromId?.symbol) return fromId.symbol;

  const fromMarkets = Object.values(markets).find((market) => market.id === marketId);
  if (isUsdtLinearSwapMarket(fromMarkets)) return fromMarkets.symbol;

  return null;
}

async function discoverTradedUsdtFuturesSymbols(
  exchange: BinanceExchangeClient,
  markets: Record<string, BinanceMarket>,
  sinceTs: number
): Promise<string[]> {
  const marketIds = new Set<string>();
  let cursor = sinceTs;
  const endTime = Date.now();

  for (let page = 0; page < MAX_INCOME_PAGES; page++) {
    const rows = await exchange.fapiPrivateGetIncome({
      startTime: cursor,
      endTime,
      limit: INCOME_PAGE_LIMIT,
    });

    if (rows.length === 0) break;

    let latestTime = cursor;
    for (const row of rows) {
      const symbol = row.symbol?.trim();
      if (symbol) marketIds.add(symbol);

      const rowTime = Number(row.time);
      if (Number.isFinite(rowTime) && rowTime > latestTime) {
        latestTime = rowTime;
      }
    }

    if (rows.length < INCOME_PAGE_LIMIT || latestTime <= cursor) break;
    cursor = latestTime + 1;
  }

  return Array.from(marketIds)
    .map((marketId) => marketSymbolFromId(exchange, markets, marketId))
    .filter((symbol): symbol is string => !!symbol)
    .sort();
}

async function fetchIncomeRows(
  exchange: BinanceExchangeClient,
  sinceTs: number,
  endTime = Date.now()
): Promise<BinanceIncomeRow[]> {
  const rows: BinanceIncomeRow[] = [];

  for (let windowStart = sinceTs; windowStart <= endTime; windowStart += MAX_INCOME_WINDOW_MS + 1) {
    const windowEnd = Math.min(endTime, windowStart + MAX_INCOME_WINDOW_MS);
    rows.push(...await fetchIncomeRowsWindow(exchange, windowStart, windowEnd));
  }

  return rows;
}

async function fetchIncomeRowsWindow(
  exchange: BinanceExchangeClient,
  startTime: number,
  endTime: number
): Promise<BinanceIncomeRow[]> {
  const rows: BinanceIncomeRow[] = [];
  let cursor = startTime;

  for (let page = 0; page < MAX_INCOME_PAGES; page++) {
    const pageRows = await exchange.fapiPrivateGetIncome({
      startTime: cursor,
      endTime,
      limit: INCOME_PAGE_LIMIT,
    });

    if (pageRows.length === 0) break;
    rows.push(...pageRows);

    let latestTime = cursor;
    for (const row of pageRows) {
      const rowTime = Number(row.time);
      if (Number.isFinite(rowTime) && rowTime > latestTime) {
        latestTime = rowTime;
      }
    }

    if (pageRows.length < INCOME_PAGE_LIMIT || latestTime <= cursor) break;
    cursor = latestTime + 1;
  }

  return rows;
}

function accountFlowFromIncomeRow(row: BinanceIncomeRow): RawAccountFlow | null {
  const type = String(row.incomeType || "").trim();
  const amountRaw = String(row.income ?? "");
  const amount = Number(amountRaw);
  const time = Number(row.time);

  if (!type || !Number.isFinite(amount) || !Number.isFinite(time)) {
    return null;
  }

  const symbol = row.symbol?.trim() || "";
  const tradeId = String(row.tradeId ?? "");
  const tranId = String(row.tranId ?? time);

  return {
    externalId: `binance_income_${type}_${tranId}_${tradeId}_${amountRaw}`,
    type,
    amount,
    asset: String(row.asset || "USDT"),
    symbol: symbol || null,
    info: row.info ?? null,
    time: new Date(time),
  };
}

function normalizedFillSymbol(fill: BinanceFill): string {
  return fill.symbol?.replace("/", "").replace(":USDT", "") || "";
}

function orderKeyForFill(fill: BinanceFill): string {
  return String(fill.info?.orderId ?? fill.order ?? fill.id ?? fill.timestamp ?? "unknown");
}

function normalizedOrderSide(fill: BinanceFill): OrderSide {
  return String(fill.side).toLowerCase() === "buy" ? "buy" : "sell";
}

function tradeSideFromOpeningOrder(orderSide: OrderSide): TradeSide {
  return orderSide === "buy" ? "Long" : "Short";
}

function rawTradeFromClosedPosition(position: BinancePosition): RawTrade {
  return {
    externalId: `binance_position_${position.symbol}_${position.firstOrderKey}_${position.lastOrderKey}`,
    symbol: position.symbol,
    baseCoin: position.baseCoin,
    quoteCoin: "USDT",
    side: position.side,
    leverage: 1,
    marginMode: "cross",
    entryPrice: position.entryQty > 0 ? position.entryValue / position.entryQty : 0,
    entryQty: position.entryQty,
    entryValue: position.entryValue,
    entryTime: position.firstTime,
    exitPrice: position.exitQty > 0 ? position.exitValue / position.exitQty : 0,
    exitQty: position.exitQty,
    exitValue: position.exitValue,
    exitTime: position.lastTime,
    realizedPnl: position.realizedPnl,
    fee: position.fee,
    makerFee: position.makerFee,
    takerFee: position.takerFee,
    fundingFee: 0,
  };
}

function openPositionFromOrder(order: BinanceOrderGroup): BinancePosition {
  return {
    symbol: order.symbol,
    baseCoin: order.baseCoin,
    side: tradeSideFromOpeningOrder(order.orderSide),
    firstOrderKey: order.orderKey,
    lastOrderKey: order.orderKey,
    entryQty: order.quantity,
    entryValue: order.value,
    exitQty: 0,
    exitValue: 0,
    remainingQty: order.quantity,
    realizedPnl: 0,
    fee: order.fee,
    makerFee: order.makerFee,
    takerFee: order.takerFee,
    firstTime: order.firstTime,
    lastTime: order.lastTime,
  };
}

function addOpeningOrder(position: BinancePosition, order: BinanceOrderGroup): void {
  position.entryQty += order.quantity;
  position.entryValue += order.value;
  position.remainingQty += order.quantity;
  position.fee += order.fee;
  position.makerFee += order.makerFee;
  position.takerFee += order.takerFee;
  position.lastOrderKey = order.orderKey;
  if (order.lastTime > position.lastTime) position.lastTime = order.lastTime;
}

function addClosingOrder(position: BinancePosition, order: BinanceOrderGroup): number {
  const closeQty = Math.min(position.remainingQty, order.quantity);
  const ratio = order.quantity > 0 ? closeQty / order.quantity : 0;

  position.exitQty += closeQty;
  position.exitValue += order.value * ratio;
  position.remainingQty -= closeQty;
  position.realizedPnl += order.realizedPnl * ratio;
  position.fee += order.fee * ratio;
  position.makerFee += order.makerFee * ratio;
  position.takerFee += order.takerFee * ratio;
  position.lastOrderKey = order.orderKey;
  if (order.lastTime > position.lastTime) position.lastTime = order.lastTime;

  return order.quantity - closeQty;
}

function buildBinanceOrderGroups(fills: BinanceFill[]): BinanceOrderGroup[] {
  const groups = new Map<string, BinanceOrderGroup>();

  for (const fill of fills) {
    const symbol = normalizedFillSymbol(fill);
    const baseCoin = symbol.replace("USDT", "");
    const orderKey = orderKeyForFill(fill);
    const groupKey = `${symbol}:${orderKey}`;
    const feeCost = fill.fee?.cost || 0;
    const isMaker = fill.takerOrMaker === "maker";
    const fillTime = new Date(fill.timestamp || Date.now());
    const fillPrice = fill.price || 0;
    const fillQty = fill.amount || 0;
    const fillValue = fillPrice * fillQty;
    const pnl = Number(fill.info?.realizedPnl) || 0;

    const existing = groups.get(groupKey);
    if (existing) {
      existing.quantity += fillQty;
      existing.value += fillValue;
      existing.realizedPnl += pnl;
      existing.fee += feeCost;
      existing.makerFee += isMaker ? feeCost : 0;
      existing.takerFee += isMaker ? 0 : feeCost;
      if (fillTime < existing.firstTime) existing.firstTime = fillTime;
      if (fillTime > existing.lastTime) existing.lastTime = fillTime;
      continue;
    }

    groups.set(groupKey, {
      externalId: `binance_order_${symbol}_${orderKey}`,
      orderKey,
      symbol,
      baseCoin,
      orderSide: normalizedOrderSide(fill),
      quantity: fillQty,
      value: fillValue,
      realizedPnl: pnl,
      fee: feeCost,
      makerFee: isMaker ? feeCost : 0,
      takerFee: isMaker ? 0 : feeCost,
      firstTime: fillTime,
      lastTime: fillTime,
    });
  }

  return Array.from(groups.values())
    .sort((a, b) => a.firstTime.getTime() - b.firstTime.getTime() || a.externalId.localeCompare(b.externalId));
}

function leftoverOpeningOrder(order: BinanceOrderGroup, quantity: number): BinanceOrderGroup | null {
  if (quantity <= POSITION_QTY_EPSILON || order.quantity <= 0) return null;

  const ratio = quantity / order.quantity;
  return {
    ...order,
    quantity,
    value: order.value * ratio,
    realizedPnl: 0,
    fee: order.fee * ratio,
    makerFee: order.makerFee * ratio,
    takerFee: order.takerFee * ratio,
  };
}

function aggregateBinancePositionFills(fills: BinanceFill[]): RawTrade[] {
  const orders = buildBinanceOrderGroups(fills);
  const positions = new Map<string, BinancePosition>();
  const completed: RawTrade[] = [];

  for (const order of orders) {
    const current = positions.get(order.symbol);

    if (!current) {
      if (order.realizedPnl === 0) {
        positions.set(order.symbol, openPositionFromOrder(order));
      }
      continue;
    }

    if (tradeSideFromOpeningOrder(order.orderSide) === current.side) {
      addOpeningOrder(current, order);
      continue;
    }

    const leftoverQty = addClosingOrder(current, order);
    if (current.remainingQty <= POSITION_QTY_EPSILON) {
      completed.push(rawTradeFromClosedPosition(current));
      positions.delete(order.symbol);

      const leftover = leftoverOpeningOrder(order, leftoverQty);
      if (leftover) {
        positions.set(order.symbol, openPositionFromOrder(leftover));
      }
    }
  }

  return completed
    .sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime() || a.externalId.localeCompare(b.externalId));
}

/**
 * Fetch individual fills from Binance Futures and reconstruct closed positions.
 * Binance can split one position across many execution fills and multiple
 * partial-close orders, so fills are first grouped by order and then replayed
 * chronologically until the position quantity returns to zero.
 */
export async function fetchBinanceTrades(
  credentials: ExchangeCredentials,
  since?: Date
): Promise<RawTrade[]> {
  const exchange = new ccxt.binance({
    apiKey: credentials.apiKey,
    secret: credentials.apiSecret,
    enableRateLimit: true,
    options: { defaultType: "future" },
  }) as unknown as BinanceExchangeClient;

  const fills: BinanceFill[] = [];
  const sinceTs = since ? since.getTime() : Date.now() - BINANCE_DEFAULT_TRADE_WINDOW_MS;
  const fillSinceTs = Math.max(0, sinceTs - BINANCE_POSITION_LOOKBACK_MS);
  const markets = await exchange.loadMarkets();
  const symbols = await discoverTradedUsdtFuturesSymbols(exchange, markets, sinceTs);

  for (const symbol of symbols) {
    const symbolFills = await exchange.fetchMyTrades(symbol, fillSinceTs, undefined, {
      type: "future",
      paginate: true,
    });

    fills.push(...symbolFills);
  }

  return aggregateBinancePositionFills(fills)
    .filter((trade) => trade.exitTime.getTime() >= sinceTs);
}

export async function fetchBinanceAccountFlows(
  credentials: ExchangeCredentials,
  since?: Date
): Promise<RawAccountFlow[]> {
  const exchange = new ccxt.binance({
    apiKey: credentials.apiKey,
    secret: credentials.apiSecret,
    enableRateLimit: true,
    options: { defaultType: "future" },
  }) as unknown as BinanceExchangeClient;

  const sinceTs = since ? since.getTime() : Date.now() - 365 * 24 * 60 * 60 * 1000;
  const rows = await fetchIncomeRows(exchange, sinceTs);

  return rows
    .map(accountFlowFromIncomeRow)
    .filter((flow): flow is RawAccountFlow => !!flow)
    .sort((a, b) => a.time.getTime() - b.time.getTime() || a.externalId.localeCompare(b.externalId));
}

export async function syncBinance(
  credentials: ExchangeCredentials,
  since?: Date
): Promise<SyncResult> {
  try {
    const trades = await fetchBinanceTrades(credentials, since);
    return { success: true, tradesAdded: trades.length };
  } catch (error) {
    return {
      success: false,
      tradesAdded: 0,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
