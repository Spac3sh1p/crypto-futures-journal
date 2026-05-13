import ccxt from "ccxt";
import type { ExchangeCredentials, RawTrade, SyncResult } from "./types";

/**
 * Fetch individual fills from Hyperliquid.
 * Each returned RawTrade represents a single execution fill.
 * See RawTrade docs for limitations (entry=exit, holdDuration=0).
 */
export async function fetchHyperliquidTrades(
  credentials: ExchangeCredentials,
  since?: Date
): Promise<RawTrade[]> {
  const exchange = new ccxt.hyperliquid({
    apiKey: credentials.apiKey,
    secret: credentials.apiSecret,
    options: { defaultType: "swap" },
  });

  const trades: RawTrade[] = [];
  const sinceTs = since ? since.getTime() : Date.now() - 90 * 24 * 60 * 60 * 1000;

  const fills = await exchange.fetchMyTrades(undefined, sinceTs, undefined, {
    type: "swap",
  });

  for (const fill of fills) {
    const symbol = fill.symbol?.replace("/", "").replace(":USDC", "") || "";
    const baseCoin = symbol.replace("USDC", "").replace("USDT", "");

    const feeCost = fill.fee?.cost || 0;
    const isMaker = fill.takerOrMaker === "maker";
    const fillTime = new Date(fill.timestamp || Date.now());
    const fillPrice = fill.price || 0;
    const fillQty = fill.amount || 0;
    const fillValue = fillPrice * fillQty;
    const pnl = Number((fill.info as Record<string, unknown>)?.closedPnl) || 0;

    trades.push({
      externalId: fill.id || `hyperliquid_${fill.timestamp}`,
      symbol,
      baseCoin,
      quoteCoin: "USDC",
      side: fill.side === "buy" ? "Long" : "Short",
      leverage: 1,
      marginMode: "cross",
      entryPrice: fillPrice,
      entryQty: fillQty,
      entryValue: fillValue,
      entryTime: fillTime,
      exitPrice: fillPrice,
      exitQty: fillQty,
      exitValue: fillValue,
      exitTime: fillTime,
      realizedPnl: pnl,
      fee: feeCost,
      makerFee: isMaker ? feeCost : 0,
      takerFee: isMaker ? 0 : feeCost,
      fundingFee: 0,
    });
  }

  return trades;
}

export async function syncHyperliquid(
  credentials: ExchangeCredentials,
  since?: Date
): Promise<SyncResult> {
  try {
    const trades = await fetchHyperliquidTrades(credentials, since);
    return { success: true, tradesAdded: trades.length };
  } catch (error) {
    return {
      success: false,
      tradesAdded: 0,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
