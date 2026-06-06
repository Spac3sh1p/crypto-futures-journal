import { Suspense } from "react";
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
import { OverviewCurveChart } from "@/components/overview/OverviewCurveChart";
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

function formatNullableRatio(value: number | null): string {
  return value === null ? "--" : value.toFixed(2);
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
    <div className="trading-card min-h-[112px] px-4 py-3.5">
      <div className="terminal-label">{label}</div>
      <div className={`mt-2 font-mono text-[24px] font-bold leading-tight tabular-nums min-[1500px]:text-[26px] ${valueColor}`}>{value}</div>
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
  const curve = accountFlows.length > 0
    ? buildAccountFlowPnlSeries(accountFlows, rangeStart)
    : buildCumulativePnlSeries(trades);
  const latestPoint = curve.at(-1);
  const periodPnl = latestPoint?.value ?? metrics.totalPnl;
  const sharpeRatio = calculateAnnualizedSharpeRatio(curve);
  const recentTrades = [...trades]
    .sort((a, b) => b.exitTime.getTime() - a.exitTime.getTime())
    .slice(0, 6)
    .map(serializeTrade);
  const symbolTop10 = buildSymbolTop10Report(trades);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <KpiTile
          label={dictionary.performance.metrics.totalPnl}
          value={formatMoney(periodPnl)}
          tone={periodPnl >= 0 ? "green" : "red"}
        />
        <KpiTile
          label={text.balance}
          value={balanceValue}
          tone={walletBalance.total !== null && walletBalance.total >= 0 ? "green" : "neutral"}
        />
        <KpiTile
          label={text.winRate}
          value={`${metrics.winRate.toFixed(1)}%`}
          subValue={`${metrics.winCount}${dictionary.common.wins} / ${metrics.lossCount}${dictionary.common.losses}`}
        />
        <KpiTile
          label={dictionary.performance.metrics.sharpeRatio}
          value={formatNullableRatio(sharpeRatio)}
          subValue={dictionary.performance.metrics.sharpeRatioSub}
          tone={sharpeRatio !== null && sharpeRatio > 0 ? "green" : "neutral"}
        />
        <KpiTile
          label={dictionary.performance.metrics.profitFactor}
          value={metrics.profitFactor.toFixed(2)}
          subValue={dictionary.performance.metrics.profitFactorSub}
        />
        <KpiTile
          label={text.trades}
          value={String(metrics.totalTrades)}
          subValue={`${dictionary.common.win} ${metrics.winCount} / ${dictionary.common.loss} ${metrics.lossCount}`}
        />
        <KpiTile
          label={text.maxDrawdown}
          value={`-$${metrics.maxDrawdown.toFixed(0)}`}
          subValue={metrics.maxConsecutiveLosses > 0 ? `${metrics.maxConsecutiveLosses} ${dictionary.performance.metrics.consecutiveLosses}` : undefined}
          tone="red"
        />
      </section>

      <section>
        <div className="trading-panel min-w-0 p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="terminal-section-title">{dictionary.performance.cumulative.title}</h2>
              <p className="mt-1 text-xs font-medium text-text-muted">{dictionary.performance.cumulative.subtitle}</p>
            </div>
          </div>
          <div className="-mx-2 overflow-x-auto px-2">
            <Suspense>
              <OverviewCurveChart data={curve} />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <SymbolTop10Table data={symbolTop10} text={text.symbolTop10} />
        <PeriodReviewPanel text={text.periodReview} />
      </section>

      <section>
        <div id="recent-trades">
          <OverviewRecentTrades trades={recentTrades} />
        </div>
      </section>
    </div>
  );
}
