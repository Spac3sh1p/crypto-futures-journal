export interface CalendarTradeLike {
  id: string;
  symbol: string;
  side: string;
  realizedPnl: number;
  entryTime: Date;
  exitTime: Date;
  fee: number;
  fundingFee: number;
  isWin?: boolean;
}

export interface MonthlyCalendarTrade {
  id: string;
  symbol: string;
  side: string;
  pnl: number;
  isWin: boolean;
  entryTime: Date;
  exitTime: Date;
  fee: number;
  fundingFee: number;
}

export interface MonthlyCalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  pnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  trades: MonthlyCalendarTrade[];
}

export interface MonthlyCalendarWeek {
  label: string;
  pnl: number;
  tradeCount: number;
  days: MonthlyCalendarDay[];
}

export interface MonthlyCalendarHighlightTrade {
  id: string;
  symbol: string;
  side: string;
  pnl: number;
  exitTime: Date;
}

export interface MonthlyCalendarTopSymbol {
  symbol: string;
  tradeCount: number;
  pnl: number;
}

export interface MonthlyCalendarSummary {
  month: string;
  totalPnl: number;
  tradeCount: number;
  tradingDays: number;
  greenDays: number;
  redDays: number;
  flatDays: number;
  bestTrade: MonthlyCalendarHighlightTrade | null;
  worstTrade: MonthlyCalendarHighlightTrade | null;
  topSymbol: MonthlyCalendarTopSymbol | null;
  weeks: MonthlyCalendarWeek[];
}

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function normalizeMonthParam(raw: string | undefined, fallback = new Date()): string {
  const match = raw?.match(MONTH_PATTERN);
  if (!match) return formatMonthKey(fallback);

  const month = Number(match[2]);
  if (month < 1 || month > 12) return formatMonthKey(fallback);

  return match[0];
}

export function getMonthDateRange(monthKey: string): { start: Date; end: Date } {
  const month = normalizeMonthParam(monthKey);
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    start: new Date(year, monthNumber - 1, 1),
    end: new Date(year, monthNumber, 1),
  };
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfMondayWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  return start;
}

function isInMonth(date: Date, monthKey: string): boolean {
  return formatMonthKey(date) === monthKey;
}

function toCalendarTrade(trade: CalendarTradeLike): MonthlyCalendarTrade {
  return {
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    pnl: trade.realizedPnl,
    isWin: trade.isWin ?? trade.realizedPnl > 0,
    entryTime: trade.entryTime,
    exitTime: trade.exitTime,
    fee: trade.fee,
    fundingFee: trade.fundingFee,
  };
}

function buildEmptyDay(date: Date, monthKey: string): MonthlyCalendarDay {
  return {
    date: formatDateKey(date),
    dayOfMonth: date.getDate(),
    isCurrentMonth: isInMonth(date, monthKey),
    pnl: 0,
    tradeCount: 0,
    winCount: 0,
    lossCount: 0,
    trades: [],
  };
}

function summarizeDay(day: MonthlyCalendarDay, trades: MonthlyCalendarTrade[]): MonthlyCalendarDay {
  const pnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winCount = trades.filter((trade) => trade.pnl > 0).length;
  const lossCount = trades.filter((trade) => trade.pnl < 0).length;

  return {
    ...day,
    pnl,
    tradeCount: trades.length,
    winCount,
    lossCount,
    trades,
  };
}

function toHighlightTrade(trade: MonthlyCalendarTrade): MonthlyCalendarHighlightTrade {
  return {
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side,
    pnl: trade.pnl,
    exitTime: trade.exitTime,
  };
}

function buildTopSymbol(trades: MonthlyCalendarTrade[]): MonthlyCalendarTopSymbol | null {
  const bySymbol = new Map<string, MonthlyCalendarTopSymbol>();

  for (const trade of trades) {
    const current = bySymbol.get(trade.symbol) ?? {
      symbol: trade.symbol,
      tradeCount: 0,
      pnl: 0,
    };
    current.tradeCount += 1;
    current.pnl += trade.pnl;
    bySymbol.set(trade.symbol, current);
  }

  return Array.from(bySymbol.values()).sort((a, b) => {
    if (b.tradeCount !== a.tradeCount) return b.tradeCount - a.tradeCount;
    if (b.pnl !== a.pnl) return b.pnl - a.pnl;
    return a.symbol.localeCompare(b.symbol);
  })[0] ?? null;
}

export function buildMonthlyCalendar(
  trades: CalendarTradeLike[],
  rawMonth: string
): MonthlyCalendarSummary {
  const month = normalizeMonthParam(rawMonth);
  const { start, end } = getMonthDateRange(month);
  const visibleStart = startOfMondayWeek(start);
  const visibleEnd = addDays(startOfMondayWeek(addDays(end, -1)), 6);
  const monthTrades = trades
    .filter((trade) => trade.exitTime >= start && trade.exitTime < end)
    .sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime())
    .map(toCalendarTrade);

  const tradesByDay = new Map<string, MonthlyCalendarTrade[]>();
  for (const trade of monthTrades) {
    const key = formatDateKey(trade.exitTime);
    const bucket = tradesByDay.get(key) ?? [];
    bucket.push(trade);
    tradesByDay.set(key, bucket);
  }

  const weeks: MonthlyCalendarWeek[] = [];
  let cursor = new Date(visibleStart);
  let weekIndex = 1;
  while (cursor <= visibleEnd) {
    const days: MonthlyCalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(cursor, i);
      const day = buildEmptyDay(date, month);
      days.push(summarizeDay(day, tradesByDay.get(day.date) ?? []));
    }

    weeks.push({
      label: `WK${weekIndex}`,
      pnl: days.reduce((sum, day) => sum + (day.isCurrentMonth ? day.pnl : 0), 0),
      tradeCount: days.reduce((sum, day) => sum + (day.isCurrentMonth ? day.tradeCount : 0), 0),
      days,
    });

    cursor = addDays(cursor, 7);
    weekIndex += 1;
  }

  const tradeDays = weeks.flatMap((week) => week.days).filter((day) => day.isCurrentMonth && day.tradeCount > 0);
  const bestTrade = monthTrades.reduce<MonthlyCalendarTrade | null>(
    (best, trade) => (best === null || trade.pnl > best.pnl ? trade : best),
    null
  );
  const worstTrade = monthTrades.reduce<MonthlyCalendarTrade | null>(
    (worst, trade) => (worst === null || trade.pnl < worst.pnl ? trade : worst),
    null
  );

  return {
    month,
    totalPnl: monthTrades.reduce((sum, trade) => sum + trade.pnl, 0),
    tradeCount: monthTrades.length,
    tradingDays: tradeDays.length,
    greenDays: tradeDays.filter((day) => day.pnl > 0).length,
    redDays: tradeDays.filter((day) => day.pnl < 0).length,
    flatDays: tradeDays.filter((day) => day.pnl === 0).length,
    bestTrade: bestTrade ? toHighlightTrade(bestTrade) : null,
    worstTrade: worstTrade ? toHighlightTrade(worstTrade) : null,
    topSymbol: buildTopSymbol(monthTrades),
    weeks,
  };
}
