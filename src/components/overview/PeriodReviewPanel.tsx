import { TradeNavigationLink as Link } from "@/components/dashboard/TradeNavigationGuard";
import { buildTradeHistoryHref, type TradeHistoryScope } from "@/lib/dashboard/trade-history-routing";
import type { Dictionary } from "@/lib/i18n";

type PeriodReviewText = Dictionary["overview"]["periodReview"];

export function PeriodReviewPanel({ text, scope }: { text: PeriodReviewText; scope?: TradeHistoryScope }) {
  return (
    <section className="trading-panel flex h-full min-h-60 flex-col p-5">
      <h3 className="terminal-section-title">{text.title}</h3>
      <div className="my-auto py-6">
        <p className="text-sm font-medium text-text-secondary">{text.subtitle}</p>
        <p className="mt-2 max-w-md text-xs leading-6 text-text-muted">{text.emptyHint}</p>
        <Link href={buildTradeHistoryHref(scope)} className="mt-5 inline-block rounded-lg border border-border bg-bg-tertiary px-4 py-2 text-xs font-semibold text-text-secondary hover:border-yellow/40 hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60">{text.startReview}</Link>
      </div>
    </section>
  );
}
