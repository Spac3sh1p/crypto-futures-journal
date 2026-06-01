export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  exchange: "bybit" | "binance" | "hyperliquid";
}

/**
 * RawTrade represents one normalized imported trade row.
 *
 * Binance USDT futures imports reconstruct closed positions from execution
 * fills, including multiple fills per order and partial-close orders. Other
 * exchange importers may still emit fill-level rows until their closed-position
 * history APIs are wired in.
 *
 * PnL accuracy depends on the exchange including realized PnL in trade data.
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

export interface RawAccountFlow {
  externalId: string;
  type: string;
  asset: string;
  amount: number;
  symbol: string | null;
  info: string | null;
  time: Date;
}

export interface SyncResult {
  success: boolean;
  tradesAdded: number;
  message?: string;
}
