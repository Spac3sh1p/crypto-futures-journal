import { Suspense } from "react";
import { parseRange } from "@/lib/formatters";
import { getTradesInRange, getTodayPnl } from "@/lib/dashboard/queries";
import {
  buildCumulativePnlSeries,
  buildTradeCountSeries,
} from "@/lib/dashboard/transforms";
import { calculateMetrics } from "@/lib/analysis";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CumulativePnlChart } from "@/components/charts/CumulativePnlChart";
import { TradeCountChart } from "@/components/charts/TradeCountChart";
import { TradeHistoryTable } from "@/components/dashboard/TradeHistoryTable";

interface PageProps {
  searchParams: Promise<{ range?: string; exchangeId?: string }>;
}

export default async function PerformancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const exchangeId = params.exchangeId;

  const trades = await getTradesInRange(range, exchangeId);
  const todayPnl = await getTodayPnl(exchangeId);
  const metrics = calculateMetrics(trades);

  const cumulativePnl = buildCumulativePnlSeries(trades);
  const tradeCount = buildTradeCountSeries(trades);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Total PnL"
          value={`${metrics.totalPnl >= 0 ? "+" : ""}$${metrics.totalPnl.toFixed(2)}`}
          valueColor={metrics.totalPnl >= 0 ? "green" : "red"}
          subValue={`${metrics.totalTrades} trades`}
        />
        <MetricCard
          label="Today"
          value={`${todayPnl >= 0 ? "+" : ""}$${todayPnl.toFixed(2)}`}
          valueColor={todayPnl >= 0 ? "green" : "red"}
        />
        <MetricCard
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          subValue={`${metrics.winCount}W / ${metrics.lossCount}L`}
        />
        <MetricCard
          label="Profit Factor"
          value={metrics.profitFactor.toFixed(2)}
          subValue="Gross P / Gross L"
        />
        <MetricCard
          label="Avg Win"
          value={`+$${metrics.avgWin.toFixed(0)}`}
          valueColor="green"
          subValue={`Avg Loss: -$${Math.abs(metrics.avgLoss).toFixed(0)}`}
        />
        <MetricCard
          label="Max Drawdown"
          value={`-$${metrics.maxDrawdown.toFixed(0)}`}
          valueColor="red"
          subValue={`${metrics.maxConsecutiveLosses} consec. losses`}
        />
      </div>

      {/* Charts */}
      <Suspense>
        <CumulativePnlChart data={cumulativePnl} />
      </Suspense>

      <TradeCountChart data={tradeCount} />

      <TradeHistoryTable
        trades={trades.map((t) => ({
          id: t.id,
          exchangeName: t.exchange.name,
          symbol: t.symbol,
          side: t.side,
          leverage: t.leverage,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          realizedPnl: t.realizedPnl,
          fee: t.fee,
          fundingFee: t.fundingFee,
          holdDuration: t.holdDuration,
          entryTime: t.entryTime.toISOString(),
          exitTime: t.exitTime.toISOString(),
          tags: t.tags,
          notes: t.notes,
          entryQty: t.entryQty,
          entryValue: t.entryValue,
        }))}
      />
    </div>
  );
}
