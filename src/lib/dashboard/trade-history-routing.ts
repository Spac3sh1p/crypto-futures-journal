import { formatDateKey } from "./calendar-transforms";

export const TRADE_HISTORY_PAGE_SIZE = 20;
export const ENTRY_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function normalizeDashboardParams(params: object): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(params).map(([key, value]) => {
    const first = Array.isArray(value) ? value[0] : value;
    return [key, typeof first === "string" ? first : undefined];
  }));
}

export interface TradeHistoryScope {
  range?: string;
  exchangeId?: string;
  symbol?: string;
  side?: string;
  tag?: string;
  exitDate?: string;
  entrySlot?: string;
  entryDay?: string;
  page?: string;
  tradeId?: string;
}

export function normalizeTradeFilters(scope: TradeHistoryScope): TradeHistoryScope {
  scope = normalizeDashboardParams(scope);
  const date = scope.exitDate;
  const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    formatDateKey(new Date(`${date}T12:00:00`)) === date;
  const slot = scope.entrySlot;
  return {
    symbol: scope.symbol?.trim() || undefined,
    side: scope.side === "Long" || scope.side === "Short" ? scope.side : undefined,
    tag: scope.tag?.trim() || undefined,
    exitDate: validDate ? date : undefined,
    entrySlot: slot !== undefined && /^(0|2|4|6|8|10|12|14|16|18|20|22)$/.test(slot) ? slot : undefined,
    entryDay: ENTRY_DAYS.some((day) => day === scope.entryDay) ? scope.entryDay : undefined,
  };
}

export function filterTradesForHistory<T extends {
  symbol: string; side: string; tags: string | null; entryTime: Date; exitTime: Date;
}>(trades: T[], scope: TradeHistoryScope): T[] {
  const filters = normalizeTradeFilters(scope);
  return trades.filter((trade) =>
    (!filters.symbol || trade.symbol === filters.symbol) &&
    (!filters.side || trade.side === filters.side) &&
    (!filters.tag || trade.tags?.split(",").some((tag) => tag.trim() === filters.tag)) &&
    (!filters.exitDate || formatDateKey(trade.exitTime) === filters.exitDate) &&
    (filters.entrySlot === undefined || Math.floor(trade.entryTime.getHours() / 2) * 2 === Number(filters.entrySlot)) &&
    (!filters.entryDay || ENTRY_DAYS[trade.entryTime.getDay()] === filters.entryDay)
  );
}

export function buildTradeHistoryHref({
  tradeId,
  exchangeId,
  range = "all",
  ...scope
}: TradeHistoryScope = {}): string {
  const params = new URLSearchParams();
  params.set("view", "trades");
  params.set("range", range);
  if (tradeId) params.set("tradeId", tradeId);
  if (exchangeId) params.set("exchangeId", exchangeId);
  for (const [key, value] of Object.entries(normalizeTradeFilters(scope))) {
    if (value !== undefined) params.set(key, value);
  }
  if (scope.page && /^[1-9]\d*$/.test(scope.page)) params.set("page", scope.page);

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
