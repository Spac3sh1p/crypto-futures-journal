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
import { AccountingNoticeV2 } from "@/components/v2/AccountingNoticeV2";
import { TradeTableV2 } from "@/components/v2/trades/TradeTableV2";

interface PageProps {
  searchParams: Promise<TradeHistoryScope>;
}

export default async function PreviewTradesPage({ searchParams }: PageProps) {
  const params = normalizeDashboardParams(await searchParams);
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
      <TradeTableV2
        key={JSON.stringify(scope)}
        trades={trades.map(serializeTrade)}
        focusedTradeId={params.tradeId}
        scope={scope}
        symbols={symbols}
        tags={tags}
      />
      <AccountingNoticeV2 trades={trades} text={dictionary.accounting} />
    </div>
  );
}
