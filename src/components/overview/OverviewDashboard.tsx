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

  const stats: OverviewStat[] = [
    {
      label: text.winRate,
      value: `${metrics.winRate.toFixed(1)}%`,
      sub: `${metrics.winCount}${dictionary.common.wins} / ${metrics.lossCount}${dictionary.common.losses}`,
    },
    {
      label: dictionary.performance.metrics.profitFactor,
      value: metrics.profitFactor.toFixed(2),
    },
    {
      label: text.maxDrawdown,
      value: `-$${metrics.maxDrawdown.toFixed(0)}`,
      sub: metrics.maxConsecutiveLosses > 0 ? `${metrics.maxConsecutiveLosses} ${dictionary.performance.metrics.consecutiveLosses}` : undefined,
    },
    {
      label: dictionary.shell.tradeCount,
      value: String(metrics.totalTrades),
      sub: template(dictionary.shell.sidePnl, {
        long: model.trades.filter((trade) => trade.side === "Long").length,
        short: model.trades.filter((trade) => trade.side === "Short").length,
      }),
    },
  ];

  return (
    <div className="space-y-4">
      <PerformancePanel
        headlineLabel={dictionary.performance.metrics.totalPnl}
        headlineValue={formatMoney(metrics.totalPnl)}
        headlineTone={metrics.totalPnl >= 0 ? "profit" : "loss"}
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
