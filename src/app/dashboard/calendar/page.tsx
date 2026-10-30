import { normalizeDashboardParams } from "@/lib/dashboard/trade-history-routing";
import { AccountingNotice } from "@/components/dashboard/AccountingNotice";
import { dictionaries } from "@/lib/i18n";
import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";
import { buildMonthlyCalendar, normalizeMonthParam } from "@/lib/dashboard/calendar-transforms";
import { getTradesForMonth } from "@/lib/dashboard/queries";
import { getServerLocale } from "@/lib/i18n-server";

interface PageProps {
  searchParams: Promise<{ month?: string; exchangeId?: string }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = normalizeDashboardParams(await searchParams);
  const month = normalizeMonthParam(params.month);
  const locale = await getServerLocale();
  const trades = await getTradesForMonth(month, params.exchangeId);
  const summary = buildMonthlyCalendar(trades, month);

  return <div className="space-y-4"><AccountingNotice trades={trades} text={dictionaries[locale].accounting} /><MonthlyCalendar summary={summary} locale={locale} exchangeId={params.exchangeId} /></div>;
}
