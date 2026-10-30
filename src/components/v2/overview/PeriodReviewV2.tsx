import { TradeNavigationLink as Link } from "@/components/dashboard/TradeNavigationGuard";
import { buildTradeHistoryHref, type TradeHistoryScope } from "@/lib/dashboard/trade-history-routing";
import { toPreviewHref } from "@/lib/dashboard/preview-routing";
import type { Dictionary } from "@/lib/i18n";
import { Panel, PanelHeader } from "@/components/v2/ui/Panel";

type PeriodReviewText = Dictionary["overview"]["periodReview"];

export function PeriodReviewV2({ text, scope }: { text: PeriodReviewText; scope?: TradeHistoryScope }) {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={text.title} divided={false} />
      <div className="flex flex-1 flex-col justify-center px-5 pb-5">
        <p className="text-[13px] text-ink-2">{text.subtitle}</p>
        <p className="mt-1.5 max-w-md text-[12px] leading-5 text-ink-3">{text.emptyHint}</p>
        <Link href={toPreviewHref(buildTradeHistoryHref(scope))} className="v2-button mt-4 self-start no-underline">
          {text.startReview}
        </Link>
      </div>
    </Panel>
  );
}
