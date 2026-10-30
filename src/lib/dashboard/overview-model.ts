import { calculateMetrics } from "@/lib/analysis";
import {
  getAccountFlowsForCurve,
  getRangeStartDate,
  getTradesInRange,
} from "@/lib/dashboard/queries";
import {
  buildAccountFlowPnlSeries,
  buildCumulativePnlSeries,
  calculateAnnualizedSharpeRatio,
} from "@/lib/dashboard/transforms";
import { buildSymbolTop10Report } from "@/lib/dashboard/analytics-transforms";
import { getWalletBalance } from "@/lib/exchange/balance";
import type { TradeRange } from "@/lib/formatters";
import type { SerializedTrade } from "@/lib/dashboard/serialized-trade";

export type AccountedTrade = Awaited<ReturnType<typeof getTradesInRange>>[number];

export interface CurvePoint {
  date: string;
  value: number;
  returnPct?: number;
}

export function serializeTrade(trade: AccountedTrade): SerializedTrade {
  return {
    id: trade.id,
    accountingStatus: trade.accountingStatus,
    exchangeName: trade.exchange.name,
    symbol: trade.symbol,
    side: trade.side,
    leverage: trade.leverage,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    realizedPnl: trade.realizedPnl,
    fee: trade.fee,
    fundingFee: trade.fundingFee,
    holdDuration: trade.holdDuration,
    entryTime: trade.entryTime.toISOString(),
    exitTime: trade.exitTime.toISOString(),
    tags: trade.tags,
    notes: trade.notes,
    entryQty: trade.entryQty,
    entryValue: trade.entryValue,
  };
}

export function formatBalance(value: number): string {
  const prefix = value < 0 ? "-$" : "$";
  return `${prefix}${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 总览页共用的数据装配：正式页面与 /preview 读同一份结果，保证数字一致。 */
export async function loadOverviewModel(range: TradeRange, exchangeId?: string) {
  const [trades, accountFlows, walletBalance] = await Promise.all([
    getTradesInRange(range, exchangeId),
    getAccountFlowsForCurve(exchangeId),
    getWalletBalance(exchangeId),
  ]);
  const metrics = calculateMetrics(trades);
  const balanceValue = walletBalance.total === null ? "--" : formatBalance(walletBalance.total);

  const rangeStart = getRangeStartDate(range);
  const curve: CurvePoint[] = buildCumulativePnlSeries(trades);
  const flowCurve = buildAccountFlowPnlSeries(accountFlows, rangeStart);
  const sharpeRatio = flowCurve.length && flowCurve.every((point) => point.netDeposits > 0)
    ? calculateAnnualizedSharpeRatio(flowCurve)
    : null;
  const flowAccounts = [...new Map(accountFlows.filter((flow) => flow.asset === "USDT")
    .map((flow) => [flow.exchangeId, flow.exchange.label ? `${flow.exchange.name} · ${flow.exchange.label}` : flow.exchange.name])).values()];
  const flowPoints: CurvePoint[] = flowCurve.map((point) => ({
    ...point,
    returnPct: point.netDeposits > 0 ? point.returnPct : undefined,
  }));
  const recentTrades = [...trades]
    .sort((a, b) => b.exitTime.getTime() - a.exitTime.getTime())
    .slice(0, 6)
    .map(serializeTrade);
  const symbolTop10 = buildSymbolTop10Report(trades);

  return {
    trades,
    metrics,
    balanceValue,
    curve,
    flowPoints,
    sharpeRatio,
    flowAccounts,
    recentTrades,
    symbolTop10,
  };
}
