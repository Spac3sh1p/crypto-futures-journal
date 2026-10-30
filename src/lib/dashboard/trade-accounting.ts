export const TRADING_ACCOUNTING_FLOW_TYPES = ["REALIZED_PNL", "COMMISSION", "FUNDING_FEE"] as const;

export const ACCOUNTING_WINDOW_TOLERANCE_MS = 2_000;

interface AccountedTrade {
  exchangeId: string;
  symbol: string;
  entryTime: Date;
  exitTime: Date;
  entryValue: number;
  realizedPnl: number;
  fee: number;
  fundingFee: number;
  pnlPercent: number;
  isWin: boolean;
  exchange?: { name: string };
  externalId?: string;
}

export type AccountingStatus = "matched" | "imported" | "needs-review";

export interface AccountingFlow {
  exchangeId?: string;
  type: string;
  asset: string;
  amount: number;
  symbol: string | null;
  time: Date;
}

export function applyAccountFlowAccountingToTrades<T extends AccountedTrade>(
  trades: T[],
  flows: AccountingFlow[]
): (T & { accountingStatus: AccountingStatus })[] {
  const assigned = trades.map(() => [] as AccountingFlow[]);
  const ambiguous = new Set<number>();
  const unallocatedFunding = new Set<number>();

  // Resolve ownership across the complete candidate set, before applying UI filters.
  // A shared time window is not sufficient evidence to assign a flow to either trade.
  for (const flow of flows) {
    const candidates: number[] = [];
    trades.forEach((trade, index) => {
      if (matchesTradeWindow(trade, flow)) candidates.push(index);
    });
    // Open positions are not stored here. Even one closed candidate cannot prove
    // ownership of an account-level funding payment; keep it in the account curve.
    if (flow.type === "FUNDING_FEE") {
      candidates.forEach((index) => unallocatedFunding.add(index));
      continue;
    }
    if (candidates.length === 1) assigned[candidates[0]].push(flow);
    if (candidates.length > 1) candidates.forEach((index) => ambiguous.add(index));
  }

  return trades.map((trade, index) => {
    const matchedFlows = assigned[index];
    const realisedFlows = matchedFlows.filter((flow) => flow.type === "REALIZED_PNL");

    if (ambiguous.has(index) || realisedFlows.length === 0 || !isBinanceGrossTrade(trade)) {
      // Known Binance imports store gross PnL. Other records retain their import basis.
      // Keep that storage contract so existing records do not need a destructive rewrite.
      const netPnl = isBinanceGrossTrade(trade)
        ? roundAccountingAmount(trade.realizedPnl - trade.fee + trade.fundingFee)
        : trade.realizedPnl;
      return {
        ...trade,
        realizedPnl: netPnl,
        pnlPercent: trade.entryValue > 0 ? (netPnl / trade.entryValue) * 100 : 0,
        isWin: netPnl > 0,
        accountingStatus: ambiguous.has(index) || unallocatedFunding.has(index) || matchedFlows.length > 0 || trade.exchange?.name === "binance" || trade.exchange?.name === "hyperliquid"
          ? "needs-review" as const
          : "imported" as const,
      };
    }

    const grossPnl = sumFlowAmounts(realisedFlows);
    const commission = sumFlowAmounts(matchedFlows.filter((flow) => flow.type === "COMMISSION"));
    const fundingFee = trade.fundingFee;
    if (isBinanceGrossTrade(trade) && (
      Math.abs(grossPnl - trade.realizedPnl) > 0.0000001 ||
      Math.abs(commission + trade.fee) > 0.0000001
    )) {
      const netPnl = roundAccountingAmount(trade.realizedPnl - trade.fee + trade.fundingFee);
      return {
        ...trade,
        realizedPnl: netPnl,
        pnlPercent: trade.entryValue > 0 ? (netPnl / trade.entryValue) * 100 : 0,
        isWin: netPnl > 0,
        accountingStatus: "needs-review" as const,
      };
    }
    const netPnl = roundAccountingAmount(grossPnl + commission + fundingFee);
    const fee = roundAccountingAmount(-commission);

    return {
      ...trade,
      realizedPnl: netPnl,
      fee,
      fundingFee,
      pnlPercent: trade.entryValue > 0 ? (netPnl / trade.entryValue) * 100 : 0,
      isWin: netPnl > 0,
      accountingStatus: unallocatedFunding.has(index) ? "needs-review" as const : "matched" as const,
    };
  });
}

function matchesTradeWindow(trade: AccountedTrade, flow: AccountingFlow): boolean {
  if (flow.asset !== "USDT") return false;
  if (!TRADING_ACCOUNTING_FLOW_TYPES.includes(flow.type as typeof TRADING_ACCOUNTING_FLOW_TYPES[number])) {
    return false;
  }
  if (flow.symbol !== trade.symbol) return false;
  if (flow.exchangeId !== trade.exchangeId) return false;

  const flowTime = flow.time.getTime();
  return (
    flowTime >= trade.entryTime.getTime() - ACCOUNTING_WINDOW_TOLERANCE_MS &&
    flowTime <= trade.exitTime.getTime() + ACCOUNTING_WINDOW_TOLERANCE_MS
  );
}

function isBinanceGrossTrade(trade: AccountedTrade): boolean {
  return trade.exchange?.name === "binance" && (
    trade.externalId?.startsWith("binance_position_") === true ||
    trade.externalId?.startsWith("binance_order_") === true
  );
}

function sumFlowAmounts(flows: AccountingFlow[]): number {
  return roundAccountingAmount(flows.reduce((sum, flow) => sum + flow.amount, 0));
}

function roundAccountingAmount(value: number): number {
  return Number(value.toFixed(8));
}
