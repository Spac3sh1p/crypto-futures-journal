export const TRADE_HISTORY_PAGE_SIZE = 20;

export function buildTradeHistoryHref({
  tradeId,
  exchangeId,
}: {
  tradeId: string;
  exchangeId?: string;
}): string {
  const params = new URLSearchParams();
  params.set("view", "trades");
  params.set("range", "all");
  params.set("tradeId", tradeId);
  if (exchangeId) params.set("exchangeId", exchangeId);

  return `/dashboard/performance?${params.toString()}`;
}

export function getInitialTradeHistoryPage(
  tradeIds: string[],
  focusedTradeId: string | undefined,
  pageSize = TRADE_HISTORY_PAGE_SIZE
): number {
  if (!focusedTradeId) return 1;

  const index = tradeIds.indexOf(focusedTradeId);
  if (index < 0) return 1;

  return Math.floor(index / pageSize) + 1;
}
