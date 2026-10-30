"use client";

import { useCallback, useState } from "react";
import { TradeNavigationLink as Link } from "@/components/dashboard/TradeNavigationGuard";
import { buildTradeHistoryHref, type TradeHistoryScope } from "@/lib/dashboard/trade-history-routing";
import { toPreviewHref } from "@/lib/dashboard/preview-routing";
import type { SerializedTrade } from "@/components/dashboard/TradeHistoryTable";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { EmptyState, Panel, PanelHeader } from "@/components/v2/ui/Panel";
import { TradeDetailV2 } from "./TradeDetailV2";
import { TradeRowV2, TradeTableHeaderV2 } from "./TradeRowV2";

export function RecentTradesV2({ trades: initialTrades, scope }: { trades: SerializedTrade[]; scope?: TradeHistoryScope }) {
  const { dictionary } = useI18n();
  const text = dictionary.overview;
  const [updates, setUpdates] = useState<Record<string, Partial<SerializedTrade>>>({});
  const trades = initialTrades.map((trade) => ({ ...trade, ...updates[trade.id] }));
  const [dirty, setDirty] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const updateTrade = useCallback((id: string, changes: { notes?: string | null; tags?: string | null }) => {
    setUpdates((current) => ({ ...current, [id]: { ...current[id], ...changes } }));
  }, []);

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title={text.recentTrades}
        subtitle={text.recentTradesHint}
        actions={
          <Link
            href={toPreviewHref(buildTradeHistoryHref(scope))}
            onClick={(event) => { if (dirty) event.preventDefault(); }}
            className="v2-button no-underline"
          >
            {dictionary.preview.viewAll}
          </Link>
        }
      />
      {trades.length === 0 ? (
        <EmptyState>{text.empty}</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <div className="lg:min-w-[1040px]">
            <TradeTableHeaderV2 />
            {trades.map((trade) => {
              const isExpanded = expandedId === trade.id;
              const detailId = `preview-recent-detail-${trade.id}`;
              return (
                <div key={trade.id}>
                  <TradeRowV2
                    trade={trade}
                    expanded={isExpanded}
                    controlsId={detailId}
                    onToggle={() => { if (!dirty) setExpandedId((current) => current === trade.id ? null : trade.id); }}
                  />
                  {isExpanded && (
                    <div id={detailId} className="border-b border-line">
                      <TradeDetailV2 key={trade.id} trade={trade} onTradeUpdated={updateTrade} onDirtyChange={setDirty} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}
