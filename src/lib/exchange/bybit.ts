import ccxt from "ccxt";
import type { ExchangeCredentials, RawTrade, SyncResult } from "./types";

export async function fetchBybitTrades(
  credentials: ExchangeCredentials,
  since?: Date
): Promise<RawTrade[]> {
  const exchange = new ccxt.bybit({
    apiKey: credentials.apiKey,
    secret: credentials.apiSecret,
    options: { defaultType: "swap" },
  });

  const trades: RawTrade[] = [];
  const sinceTs = since ? since.getTime() : Date.now() - 90 * 24 * 60 * 60 * 1000;

  const closedPositions = await exchange.fetchMyTrades(undefined, sinceTs, undefined, {
    type: "swap",
    category: "linear",
  });

  // Group trades by position (same symbol, same direction until close)
  // This is a simplified version - full implementation will handle partial fills
  for (const trade of closedPositions) {
    const symbol = trade.symbol?.replace("/", "").replace(":USDT", "") || "";
    const baseCoin = symbol.replace("USDT", "");

    const feeCost = trade.fee?.cost || 0;
    const isMaker = trade.takerOrMaker === "maker";

    trades.push({
      externalId: trade.id || `bybit_${trade.timestamp}`,
      symbol,
      baseCoin,
      quoteCoin: "USDT",
      side: trade.side === "buy" ? "Long" : "Short",
      leverage: 1, // Will be enriched from position data
      marginMode: "cross",
      entryPrice: trade.price || 0,
      entryQty: trade.amount || 0,
      entryValue: (trade.price || 0) * (trade.amount || 0),
      entryTime: new Date(trade.timestamp || Date.now()),
      exitPrice: trade.price || 0,
      exitQty: trade.amount || 0,
      exitValue: (trade.price || 0) * (trade.amount || 0),
      exitTime: new Date(trade.timestamp || Date.now()),
      realizedPnl: (trade.info as Record<string, unknown>)?.closedPnl as number || 0,
      fee: feeCost,
      makerFee: isMaker ? feeCost : 0,
      takerFee: isMaker ? 0 : feeCost,
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
