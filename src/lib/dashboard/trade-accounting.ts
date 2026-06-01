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
}

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
): T[] {
  if (trades.length === 0 || flows.length === 0) return trades;

  return trades.map((trade) => {
    const matchedFlows = flows.filter((flow) => matchesTradeWindow(trade, flow));
    const realisedFlows = matchedFlows.filter((flow) => flow.type === "REALIZED_PNL");

    if (realisedFlows.length === 0) {
      return trade;
    }

    const grossPnl = sumFlowAmounts(realisedFlows);
    const commission = sumFlowAmounts(matchedFlows.filter((flow) => flow.type === "COMMISSION"));
    const fundingFee = sumFlowAmounts(matchedFlows.filter((flow) => flow.type === "FUNDING_FEE"));
    const netPnl = roundAccountingAmount(grossPnl + commission + fundingFee);
    const fee = roundAccountingAmount(-commission);

    return {
      ...trade,
      realizedPnl: netPnl,
      fee,
      fundingFee,
      pnlPercent: trade.entryValue > 0 ? (netPnl / trade.entryValue) * 100 : 0,
      isWin: netPnl > 0,
    };
  });
}

function matchesTradeWindow(trade: AccountedTrade, flow: AccountingFlow): boolean {
  if (flow.asset !== "USDT") return false;
  if (!TRADING_ACCOUNTING_FLOW_TYPES.includes(flow.type as typeof TRADING_ACCOUNTING_FLOW_TYPES[number])) {
    return false;
  }
  if (flow.symbol !== trade.symbol) return false;
  if (flow.exchangeId && flow.exchangeId !== trade.exchangeId) return false;

  const flowTime = flow.time.getTime();
  return (
    flowTime >= trade.entryTime.getTime() - ACCOUNTING_WINDOW_TOLERANCE_MS &&
    flowTime <= trade.exitTime.getTime() + ACCOUNTING_WINDOW_TOLERANCE_MS
  );
}

function sumFlowAmounts(flows: AccountingFlow[]): number {
  return roundAccountingAmount(flows.reduce((sum, flow) => sum + flow.amount, 0));
}

function roundAccountingAmount(value: number): number {
  return Number(value.toFixed(8));
}
