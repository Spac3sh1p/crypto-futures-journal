import type { AccountingStatus } from "@/lib/dashboard/trade-accounting";
import { template, type Dictionary } from "@/lib/i18n";

export function AccountingNotice({ trades, text }: {
  trades: { accountingStatus: AccountingStatus }[];
  text: Dictionary["accounting"];
}) {
  const counts = { matched: 0, imported: 0, "needs-review": 0 };
  trades.forEach((trade) => counts[trade.accountingStatus]++);
  return (
    <details className="px-1 text-[12px] text-ink-3">
      <summary className="cursor-pointer rounded-sm text-ink-3 hover:text-ink-2">
        <span>{text.title}</span>
        <span className="ui-num ml-3">{template(text.summary, { total: trades.length, matched: counts.matched, imported: counts.imported, review: counts["needs-review"] })}</span>
      </summary>
      <p className="mt-2 max-w-4xl leading-5">{text.hint}</p>
    </details>
  );
}
