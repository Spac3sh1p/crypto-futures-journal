import { Suspense } from "react";
import { format } from "date-fns";
import { calculateMetrics } from "@/lib/analysis";
import {
  getAccountFlowsForCurve,
  getRangeStartDate,
  getTradesInRange,
} from "@/lib/dashboard/queries";
import {
  buildAccountFlowPnlSeries,
  buildCumulativePnlSeries,
} from "@/lib/dashboard/transforms";
import {
  formatMoney,
  parseRange,
} from "@/lib/formatters";
import { getWalletBalance } from "@/lib/exchange/balance";
import { getServerDictionary } from "@/lib/i18n-server";
import { OverviewCurveChart } from "@/components/overview/OverviewCurveChart";
import { OverviewRecentTrades } from "@/components/overview/OverviewRecentTrades";
import { TradeCountChart } from "@/components/charts/TradeCountChart";
import type { SerializedTrade } from "@/components/dashboard/TradeHistoryTable";

interface OverviewDashboardParams {
  range?: string;
  exchangeId?: string;
}

interface OverviewDashboardProps {
  params: OverviewDashboardParams;
  basePath?: string;
  showPreviewBadge?: boolean;
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

function formatPercent(value: number | undefined): string {
  if (value === undefined) return "--";
  const digits = Math.abs(value) >= 100 ? 0 : 1;
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatBalance(value: number): string {
  const prefix = value < 0 ? "-$" : "$";
  return `${prefix}${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function optionalNumber(value: unknown, key: string): number | undefined {
  if (!value || typeof value !== "object" || !(key in value)) return undefined;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "number" ? candidate : undefined;
}

function buildTradeOutcomeCountSeries(trades: Awaited<ReturnType<typeof getTradesInRange>>) {
  const dailyMap = new Map<string, { date: string; count: number; win: number; loss: number }>();

  for (const trade of trades) {
    const date = format(trade.exitTime, "yyyy-MM-dd");
    const bucket = dailyMap.get(date) ?? { date, count: 0, win: 0, loss: 0 };
    bucket.count += 1;
    if (trade.isWin) {
      bucket.win += 1;
    } else {
      bucket.loss += 1;
    }
    dailyMap.set(date, bucket);
  }

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
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
    <div className="trading-card px-4 py-4">
      <div className="terminal-label">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-bold leading-tight tabular-nums ${valueColor}`}>{value}</div>
      {subValue && <div className="mt-2 text-xs font-medium text-text-secondary">{subValue}</div>}
    </div>
  );
}

export async function OverviewDashboard({
  params,
  showPreviewBadge = false,
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
  const returnPct = optionalNumber(latestPoint, "returnPct");
  const needsRiskAttention = metrics.maxConsecutiveLosses >= 3 || metrics.maxDrawdown > Math.max(100, Math.abs(periodPnl) * 0.2);
  const curveStatusText = returnPct === undefined
    ? (needsRiskAttention ? text.riskWatch : text.riskGood)
    : formatPercent(returnPct);
  const curveStatusClass = returnPct === undefined
    ? "text-sm font-semibold text-text-muted"
    : `font-mono text-base font-bold tabular-nums sm:text-lg ${
        returnPct >= 0
          ? "text-yellow drop-shadow-[0_0_10px_rgba(245,179,26,0.35)]"
          : "text-red drop-shadow-[0_0_10px_rgba(255,90,95,0.32)]"
      }`;
  const recentTrades = [...trades]
    .sort((a, b) => b.exitTime.getTime() - a.exitTime.getTime())
    .slice(0, 6)
    .map(serializeTrade);
  const tradeCountData = buildTradeOutcomeCountSeries(trades);

  return (
    <div className="space-y-4">
      {showPreviewBadge && (
        <div className="inline-flex rounded-full border border-yellow/25 bg-yellow-dim px-3 py-1 text-[11px] font-semibold text-yellow">
          {text.previewBadge}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiTile
          label={dictionary.performance.metrics.totalPnl}
          value={formatMoney(periodPnl)}
          subValue={returnPct === undefined ? undefined : `${text.returnRate} ${formatPercent(returnPct)}`}
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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(360px,0.82fr)]">
        <div className="trading-panel min-w-0 p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="terminal-section-title">{dictionary.performance.cumulative.title}</h2>
              <p className="mt-1 text-xs font-medium text-text-muted">{dictionary.performance.cumulative.subtitle}</p>
            </div>
            <div className="text-right">
              <div className={`font-mono text-lg font-bold tabular-nums ${periodPnl >= 0 ? "text-green" : "text-red"}`}>
                {formatMoney(periodPnl)}
              </div>
              <div className={`mt-2 ${curveStatusClass}`}>
                {curveStatusText}
              </div>
            </div>
          </div>
          <div className="-mx-2 overflow-x-auto px-2">
            <Suspense>
              <OverviewCurveChart data={curve} />
            </Suspense>
          </div>
        </div>

        <TradeCountChart data={tradeCountData} />
      </section>

      <div id="recent-trades">
        <OverviewRecentTrades trades={recentTrades} />
      </div>
    </div>
  );
}
