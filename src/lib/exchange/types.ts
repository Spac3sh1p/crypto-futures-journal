export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  exchange: "bybit" | "binance";
}

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
  fundingFee: number;
}

export interface SyncResult {
  success: boolean;
  tradesAdded: number;
  message?: string;
}
