import { normalizeDashboardParams } from "@/lib/dashboard/trade-history-routing";
import { AccountingNoticeV2 } from "@/components/v2/AccountingNoticeV2";
import { dictionaries } from "@/lib/i18n";
import { MonthlyCalendarV2 } from "@/components/v2/calendar/MonthlyCalendarV2";
import { buildMonthlyCalendar, normalizeMonthParam } from "@/lib/dashboard/calendar-transforms";
import { getTradesForMonth } from "@/lib/dashboard/queries";
import { getServerLocale } from "@/lib/i18n-server";

interface PageProps {
  searchParams: Promise<{ month?: string; exchangeId?: string }>;
}

export default async function PreviewCalendarPage({ searchParams }: PageProps) {
  const params = normalizeDashboardParams(await searchParams);
  const month = normalizeMonthParam(params.month);
  const locale = await getServerLocale();
  const trades = await getTradesForMonth(month, params.exchangeId);
  const summary = buildMonthlyCalendar(trades, month);

  return (
    <div className="space-y-4">
      <MonthlyCalendarV2 summary={summary} locale={locale} exchangeId={params.exchangeId} />
      <AccountingNoticeV2 trades={trades} text={dictionaries[locale].accounting} />
    </div>
  );
}
