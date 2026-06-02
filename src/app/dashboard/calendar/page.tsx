import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";
import { buildMonthlyCalendar, normalizeMonthParam } from "@/lib/dashboard/calendar-transforms";
import { getTradesForMonth } from "@/lib/dashboard/queries";
import { getServerLocale } from "@/lib/i18n-server";

interface PageProps {
  searchParams: Promise<{ month?: string; exchangeId?: string }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const month = normalizeMonthParam(params.month);
  const locale = await getServerLocale();
  const trades = await getTradesForMonth(month, params.exchangeId);
  const summary = buildMonthlyCalendar(trades, month);

  return <MonthlyCalendar summary={summary} locale={locale} exchangeId={params.exchangeId} />;
}
