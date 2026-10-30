import { Suspense } from "react";
import { formatMoney, parseRange } from "@/lib/formatters";
import { getServerDictionary } from "@/lib/i18n-server";
import { template } from "@/lib/i18n";
import { loadOverviewModel } from "@/lib/dashboard/overview-model";
import { AccountingNotice } from "@/components/dashboard/AccountingNotice";
import { PerformancePanel, type OverviewStat } from "./PerformancePanel";
import { PeriodReviewPanel } from "./PeriodReviewPanel";
import { RecentTrades } from "@/components/overview/RecentTrades";
import { SymbolTop10Table } from "./SymbolTop10Table";
import { WalletBalance, WalletBalanceFallback } from "./WalletBalance";

export async function OverviewDashboard({ params }: { params: { range?: string; exchangeId?: string } }) {
  const range = parseRange(params.range);
  const exchangeId = params.exchangeId;
  const dictionary = await getServerDictionary();
  const text = dictionary.overview;
  const model = await loadOverviewModel(range, exchangeId);
  const { metrics } = model;
  const scope = { range, exchangeId };
  // 没有交易的周期不显示 +$0.00 和 0.0%：比率、回撤无从谈起，用 -- 表示；笔数照实显示 0
  const hasTrades = metrics.totalTrades > 0;
  const longCount = model.trades.filter((trade) => trade.side === "Long").length;

  const stats: OverviewStat[] = [
    {
      label: text.winRate,
      value: hasTrades ? `${metrics.winRate.toFixed(1)}%` : "--",
      sub: hasTrades ? `${metrics.winCount}${dictionary.common.wins} / ${metrics.lossCount}${dictionary.common.losses}` : undefined,
    },
    {
      label: dictionary.performance.metrics.profitFactor,
      value: hasTrades ? metrics.profitFactor.toFixed(2) : "--",
    },
    {
      label: text.maxDrawdown,
      value: !hasTrades ? "--" : metrics.maxDrawdown > 0 ? `-$${metrics.maxDrawdown.toFixed(0)}` : "$0",
      sub: metrics.maxConsecutiveLosses > 0 ? `${metrics.maxConsecutiveLosses} ${dictionary.performance.metrics.consecutiveLosses}` : undefined,
    },
    {
      label: dictionary.shell.tradeCount,
      value: String(metrics.totalTrades),
      sub: hasTrades
        ? template(dictionary.shell.sidePnl, { long: longCount, short: model.trades.length - longCount })
        : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <PerformancePanel
        headlineLabel={dictionary.performance.metrics.totalPnl}
        headlineValue={hasTrades ? formatMoney(metrics.totalPnl) : "--"}
        headlineTone={!hasTrades ? "neutral" : metrics.totalPnl >= 0 ? "profit" : "loss"}
        balanceLabel={dictionary.shell.balance}
        balance={
          <Suspense fallback={<WalletBalanceFallback />}>
            <WalletBalance exchangeId={exchangeId} />
          </Suspense>
        }
        stats={stats}
        trades={model.curve}
        flows={model.flowPoints}
        accounts={model.flowAccounts}
        sharpe={model.sharpeRatio}
      />

      <section className="grid grid-cols-1 items-stretch gap-4 min-[1440px]:grid-cols-2">
        <SymbolTop10Table data={model.symbolTop10} text={text.symbolTop10} scope={scope} />
        <PeriodReviewPanel text={text.periodReview} scope={scope} />
      </section>

      <RecentTrades key={`${range}-${exchangeId ?? "all"}`} trades={model.recentTrades} scope={scope} />

      <AccountingNotice trades={model.trades} text={dictionary.accounting} />
    </div>
  );
}
