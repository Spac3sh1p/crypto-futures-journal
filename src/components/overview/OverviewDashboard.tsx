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
import {
  formatMoney,
  parseRange,
} from "@/lib/formatters";
import { getWalletBalance } from "@/lib/exchange/balance";
import { getServerDictionary } from "@/lib/i18n-server";
import { OverviewPerformanceChart } from "@/components/overview/OverviewPerformanceChart";
import { AccountingNotice } from "@/components/dashboard/AccountingNotice";
import { OverviewRecentTrades } from "@/components/overview/OverviewRecentTrades";
import { PeriodReviewPanel } from "@/components/overview/PeriodReviewPanel";
import { SymbolTop10Table } from "@/components/overview/SymbolTop10Table";
import type { SerializedTrade } from "@/components/dashboard/TradeHistoryTable";

interface OverviewDashboardParams {
  range?: string;
  exchangeId?: string;
}

interface OverviewDashboardProps {
  params: OverviewDashboardParams;
}

function serializeTrade(trade: Awaited<ReturnType<typeof getTradesInRange>>[number]): SerializedTrade {
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

function formatBalance(value: number): string {
  const prefix = value < 0 ? "-$" : "$";
  return `${prefix}${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function KpiTile({
  label,
  value,
  subValue,
  tone = "neutral",
}: {
  label: string;
  value: string;
  subValue?: string;
  tone?: "green" | "red" | "neutral";
}) {
  const valueColor = tone === "green" ? "text-green" : tone === "red" ? "text-red" : "text-text-primary";
  return (
    <div className="trading-card min-w-0 min-h-[112px] px-4 py-3.5">
      <div className="terminal-label">{label}</div>
      <div data-kpi-value title={value} className={`mt-2 break-all font-mono text-[clamp(1.125rem,1.7vw,1.75rem)] font-bold leading-tight tabular-nums ${valueColor}`}>{value}</div>
      {subValue && <div className="mt-2 text-xs font-medium text-text-muted">{subValue}</div>}
    </div>
  );
}

export async function OverviewDashboard({
  params,
}: OverviewDashboardProps) {
  const range = parseRange(params.range);
  const exchangeId = params.exchangeId;
  const dictionary = await getServerDictionary();
  const text = dictionary.overview;

  const [trades, accountFlows, walletBalance] = await Promise.all([
    getTradesInRange(range, exchangeId),
    getAccountFlowsForCurve(exchangeId),
    getWalletBalance(exchangeId),
  ]);
  const metrics = calculateMetrics(trades);
  const balanceValue = walletBalance.total === null
    ? "--"
    : formatBalance(walletBalance.total);

  const rangeStart = getRangeStartDate(range);
  const curve = buildCumulativePnlSeries(trades);
  const flowCurve = buildAccountFlowPnlSeries(accountFlows, rangeStart);
  const sharpeRatio = flowCurve.length && flowCurve.every((point) => point.netDeposits > 0)
    ? calculateAnnualizedSharpeRatio(flowCurve) : null;
  const flowAccounts = [...new Map(accountFlows.filter((flow) => flow.asset === "USDT")
    .map((flow) => [flow.exchangeId, flow.exchange.label ? `${flow.exchange.name} · ${flow.exchange.label}` : flow.exchange.name])).values()];
  const scope = { range, exchangeId };
  const recentTrades = [...trades]
    .sort((a, b) => b.exitTime.getTime() - a.exitTime.getTime())
    .slice(0, 6)
    .map(serializeTrade);
  const symbolTop10 = buildSymbolTop10Report(trades);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label={dictionary.performance.metrics.totalPnl}
          value={formatMoney(metrics.totalPnl)}
          tone={metrics.totalPnl >= 0 ? "green" : "red"}
        />
        <KpiTile
          label={text.winRate}
          value={`${metrics.winRate.toFixed(1)}%`}
          subValue={`${metrics.winCount}${dictionary.common.wins} / ${metrics.lossCount}${dictionary.common.losses}`}
        />
        <KpiTile
          label={dictionary.performance.metrics.profitFactor}
          value={metrics.profitFactor.toFixed(2)}
          subValue={dictionary.performance.metrics.profitFactorSub}
        />
        <KpiTile
          label={text.maxDrawdown}
          value={`-$${metrics.maxDrawdown.toFixed(0)}`}
          subValue={metrics.maxConsecutiveLosses > 0 ? `${metrics.maxConsecutiveLosses} ${dictionary.performance.metrics.consecutiveLosses}` : undefined}
          tone="red"
        />
      </section>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-border px-4 py-3 text-xs text-text-muted">
        <span>{dictionary.accounting.currentBalance} <strong className="ml-2 font-mono text-sm font-semibold text-text-secondary">{balanceValue}</strong></span>
        <span>{dictionary.accounting.tradeCount} <strong className="ml-2 font-mono text-sm font-semibold text-text-secondary">{metrics.totalTrades}</strong></span>
        <span>{dictionary.common.win} {metrics.winCount} / {dictionary.common.loss} {metrics.lossCount}</span>
      </div>
      <AccountingNotice trades={trades} text={dictionary.accounting} />
      <OverviewPerformanceChart trades={curve} flows={flowCurve.map((point) => ({ ...point, returnPct: point.netDeposits > 0 ? point.returnPct : undefined }))} accounts={flowAccounts} sharpe={sharpeRatio} />

      <section className="grid grid-cols-1 items-start gap-4 min-[1440px]:grid-cols-2">
        <SymbolTop10Table data={symbolTop10} text={text.symbolTop10} scope={scope} />
        <PeriodReviewPanel text={text.periodReview} scope={scope} />
      </section>

      <section>
        <div id="recent-trades">
          <OverviewRecentTrades key={`${range}-${exchangeId ?? "all"}`} trades={recentTrades} scope={scope} />
        </div>
      </section>
    </div>
  );
}
