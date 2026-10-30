import type { AccountingStatus } from "@/lib/dashboard/trade-accounting";
import { template, type Dictionary } from "@/lib/i18n";

export function AccountingNotice({ trades, text }: {
  trades: { accountingStatus: AccountingStatus }[];
  text: Dictionary["accounting"];
}) {
  const counts = { matched: 0, imported: 0, "needs-review": 0 };
  trades.forEach((trade) => counts[trade.accountingStatus]++);
  return (
    <details className="rounded-lg border border-border bg-bg-tertiary/40 px-4 py-3 text-xs text-text-secondary">
      <summary className="cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60">
        <span className="font-semibold">{text.title}</span>
        <span className="ml-3 text-text-muted">{template(text.summary, { total: trades.length, matched: counts.matched, imported: counts.imported, review: counts["needs-review"] })}</span>
      </summary>
      <p className="mt-2 max-w-5xl leading-relaxed text-text-muted">{text.hint}</p>
    </details>
  );
}
