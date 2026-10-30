import { formatMoney, parseRange } from "@/lib/formatters";
import { getServerDictionary } from "@/lib/i18n-server";
import { template } from "@/lib/i18n";
import { loadOverviewModel } from "@/lib/dashboard/overview-model";
import { AccountingNoticeV2 } from "@/components/v2/AccountingNoticeV2";
import { PerformancePanelV2, type OverviewStat } from "./PerformancePanelV2";
import { PeriodReviewV2 } from "./PeriodReviewV2";
import { RecentTradesV2 } from "@/components/v2/trades/RecentTradesV2";
import { SymbolTop10V2 } from "./SymbolTop10V2";

export async function OverviewV2({ params }: { params: { range?: string; exchangeId?: string } }) {
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
      label: dictionary.preview.tradeCount,
      value: String(metrics.totalTrades),
      sub: template(dictionary.preview.sidePnl, {
        long: model.trades.filter((trade) => trade.side === "Long").length,
        short: model.trades.filter((trade) => trade.side === "Short").length,
      }),
    },
  ];

  return (
    <div className="space-y-4">
      <PerformancePanelV2
        headlineLabel={dictionary.performance.metrics.totalPnl}
        headlineValue={formatMoney(metrics.totalPnl)}
        headlineTone={metrics.totalPnl >= 0 ? "profit" : "loss"}
        balanceLabel={dictionary.preview.balance}
        balanceValue={model.balanceValue}
        stats={stats}
        trades={model.curve}
        flows={model.flowPoints}
        accounts={model.flowAccounts}
        sharpe={model.sharpeRatio}
      />

      <section className="grid grid-cols-1 items-stretch gap-4 min-[1440px]:grid-cols-2">
        <SymbolTop10V2 data={model.symbolTop10} text={text.symbolTop10} scope={scope} />
        <PeriodReviewV2 text={text.periodReview} scope={scope} />
      </section>

      <RecentTradesV2 key={`${range}-${exchangeId ?? "all"}`} trades={model.recentTrades} scope={scope} />

      <AccountingNoticeV2 trades={model.trades} text={dictionary.accounting} />
    </div>
  );
}
