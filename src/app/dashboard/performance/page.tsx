import Link from "next/link";
import { parseRange } from "@/lib/formatters";
import { getTradesInRange } from "@/lib/dashboard/queries";
import { getServerDictionary } from "@/lib/i18n-server";
import { OverviewDashboard } from "@/components/overview/OverviewDashboard";
import { TradeHistoryTable, type SerializedTrade } from "@/components/dashboard/TradeHistoryTable";

interface PageProps {
  searchParams: Promise<{ range?: string; exchangeId?: string; view?: string; tradeId?: string }>;
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

function buildHref(params: { range?: string; exchangeId?: string }, view?: string): string {
  const search = new URLSearchParams();
  if (params.range) search.set("range", params.range);
  if (params.exchangeId) search.set("exchangeId", params.exchangeId);
  if (view) search.set("view", view);
  const query = search.toString();
  return query ? `/dashboard/performance?${query}` : "/dashboard/performance";
}

export default async function PerformancePage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.view !== "trades") {
    return <OverviewDashboard params={params} />;
  }

  const range = parseRange(params.range);
  const exchangeId = params.exchangeId;
  const dictionary = await getServerDictionary();
  const overview = dictionary.overview;
  const trades = await getTradesInRange(range, exchangeId);

  return (
    <div className="space-y-4">
      <section className="trading-panel p-4 lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-bg-tertiary/80 p-1" aria-label={overview.heroTitle}>
            <Link className="rounded-md px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-hover hover:text-text-primary" href={buildHref(params)}>
              {overview.secondaryNav.overview}
            </Link>
            <span className="rounded-md bg-yellow px-3 py-1.5 text-xs font-semibold text-[#08111D]">
              {overview.secondaryNav.trades}
            </span>
            <Link className="rounded-md px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-hover hover:text-text-primary" href={buildHref(params)}>
              {overview.secondaryNav.review}
            </Link>
            <Link className="rounded-md px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-hover hover:text-text-primary" href="/dashboard/analytics">
              {overview.secondaryNav.analytics}
            </Link>
          </nav>
          <Link
            href={buildHref(params)}
            className="rounded-lg border border-border bg-bg-tertiary/90 px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-yellow/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
          >
            {overview.secondaryNav.overview}
          </Link>
        </div>
      </section>

      <TradeHistoryTable
        key={params.tradeId ?? "trade-history"}
        trades={trades.map(serializeTrade)}
        focusedTradeId={params.tradeId}
      />
    </div>
  );
}
