import {
  filterTradesForHistory,
  normalizeDashboardParams,
  normalizeTradeFilters,
  type TradeHistoryScope,
} from "@/lib/dashboard/trade-history-routing";
import { parseRange } from "@/lib/formatters";
import { getTradesInRange } from "@/lib/dashboard/queries";
import { getServerDictionary } from "@/lib/i18n-server";
import { serializeTrade } from "@/lib/dashboard/overview-model";
import { AccountingNotice } from "@/components/dashboard/AccountingNotice";
import { OverviewDashboard } from "@/components/overview/OverviewDashboard";
import { TradeHistoryTable } from "@/components/trades/TradeHistoryTable";

interface PageProps {
  searchParams: Promise<TradeHistoryScope & { view?: string }>;
}

export default async function PerformancePage({ searchParams }: PageProps) {
  const params = normalizeDashboardParams(await searchParams);

  if (params.view !== "trades") {
    return <OverviewDashboard params={params} />;
  }

  const range = parseRange(params.range);
  const exchangeId = params.exchangeId;
  const dictionary = await getServerDictionary();
  const candidates = await getTradesInRange(range, exchangeId);
  const scope = { ...normalizeTradeFilters(params), range, exchangeId, tradeId: params.tradeId, page: params.page };
  const trades = filterTradesForHistory(candidates, scope);
  const symbols = [...new Set(candidates.map((trade) => trade.symbol))].sort();
  const tags = [...new Set(candidates.flatMap((trade) => trade.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? []))].sort();

  return (
    <div className="space-y-4">
      <TradeHistoryTable
        key={JSON.stringify(scope)}
        trades={trades.map(serializeTrade)}
        focusedTradeId={params.tradeId}
        scope={scope}
        symbols={symbols}
        tags={tags}
      />
      <AccountingNotice trades={trades} text={dictionary.accounting} />
    </div>
  );
}
