import type { AccountingStatus } from "@/lib/dashboard/trade-accounting";

/** 交给客户端组件的交易记录：日期转成 ISO 字符串，去掉 Prisma 关联对象。 */
export interface SerializedTrade {
  id: string;
  accountingStatus?: AccountingStatus;
  exchangeName: string;
  symbol: string;
  side: string;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnl: number;
  fee: number;
  fundingFee: number;
  holdDuration: number;
  entryTime: string;
  exitTime: string;
  tags: string | null;
  notes: string | null;
  entryQty: number;
  entryValue: number;
}
