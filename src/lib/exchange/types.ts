export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  exchange: "bybit" | "binance" | "hyperliquid";
}

/**
 * RawTrade represents a single fill from the exchange API.
 *
 * IMPORTANT: Each RawTrade is a single execution fill, NOT a closed position.
 * - entryPrice/exitPrice are the same (fill price)
 * - entryTime/exitTime are the same (fill timestamp)
 * - holdDuration will be 0
 * - realizedPnl is per-fill PnL (may be 0 for opening fills)
 *
 * Future improvement: aggregate fills into closed positions using
 * exchange position history APIs (Bybit: /v5/position/closed-pnl,
 * Binance: /fapi/v1/userTrades with positionSide, Hyperliquid: fills endpoint).
 *
 * For now, analytics treat each fill independently. PnL accuracy depends on
 * the exchange including per-fill realized PnL in trade data.
 */
export interface RawTrade {
  externalId: string;
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  side: "Long" | "Short";
  leverage: number;
  marginMode: "cross" | "isolated";
  entryPrice: number;
  entryQty: number;
  entryValue: number;
  entryTime: Date;
  exitPrice: number;
  exitQty: number;
  exitValue: number;
  exitTime: Date;
  realizedPnl: number;
  fee: number;
  makerFee: number;
  takerFee: number;
  fundingFee: number;
}

export interface SyncResult {
  success: boolean;
  tradesAdded: number;
  message?: string;
}
