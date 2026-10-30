"use client";

import { useCallback, useState } from "react";
import { TradeNavigationLink as Link } from "@/components/dashboard/TradeNavigationGuard";
import { buildTradeHistoryHref, type TradeHistoryScope } from "@/lib/dashboard/trade-history-routing";
import type { SerializedTrade } from "@/lib/dashboard/serialized-trade";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { EmptyState, Panel, PanelHeader } from "@/components/ui/Panel";
import { TradeDetailPanel } from "@/components/trades/TradeDetailPanel";
import { TradeRow, TradeTableHeader } from "@/components/trades/TradeRow";

export function RecentTrades({ trades: initialTrades, scope }: { trades: SerializedTrade[]; scope?: TradeHistoryScope }) {
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
            href={buildTradeHistoryHref(scope)}
            onClick={(event) => { if (dirty) event.preventDefault(); }}
            className="ui-button no-underline"
          >
            {dictionary.shell.viewAll}
          </Link>
        }
      />
      {trades.length === 0 ? (
        <EmptyState>{text.empty}</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <div className="lg:min-w-[1040px]">
            <TradeTableHeader />
            {trades.map((trade) => {
              const isExpanded = expandedId === trade.id;
              const detailId = `recent-detail-${trade.id}`;
              return (
                <div key={trade.id}>
                  <TradeRow
                    trade={trade}
                    expanded={isExpanded}
                    controlsId={detailId}
                    onToggle={() => { if (!dirty) setExpandedId((current) => current === trade.id ? null : trade.id); }}
                  />
                  {isExpanded && (
                    <div id={detailId} className="border-b border-line">
                      <TradeDetailPanel key={trade.id} trade={trade} onTradeUpdated={updateTrade} onDirtyChange={setDirty} />
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
