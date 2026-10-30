import { TradeNavigationLink as Link } from "@/components/dashboard/TradeNavigationGuard";
import { buildTradeHistoryHref, type TradeHistoryScope } from "@/lib/dashboard/trade-history-routing";
import { toPreviewHref } from "@/lib/dashboard/preview-routing";
import type { SymbolTop10Report } from "@/lib/dashboard/analytics-transforms";
import { formatMoney } from "@/lib/formatters";
import type { Dictionary } from "@/lib/i18n";
import { EmptyState, Panel, PanelHeader } from "@/components/v2/ui/Panel";

type SymbolTop10Text = Dictionary["overview"]["symbolTop10"];

function formatPercent(value: number | null): string {
  if (value === null) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function SymbolTop10V2({
  data,
  text,
  scope,
}: {
  data: SymbolTop10Report[];
  text: SymbolTop10Text;
  scope?: TradeHistoryScope;
}) {
  return (
    <Panel className="overflow-hidden">
      <PanelHeader title={text.title} subtitle={text.subtitle} />
      {data.length === 0 ? (
        <EmptyState>{text.empty}</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-[13px]">
            <thead>
              <tr className="text-[12px] font-normal text-ink-3">
                <th className="w-10 px-5 py-2.5 text-left font-normal">{text.rank}</th>
                <th className="px-3 py-2.5 text-left font-normal">{text.symbol}</th>
                <th className="px-3 py-2.5 text-right font-normal">{text.netPnl}</th>
                <th className="px-3 py-2.5 text-right font-normal">{text.returnRate}</th>
                <th className="px-3 py-2.5 text-right font-normal">{text.winRate}</th>
                <th className="px-5 py-2.5 text-right font-normal">{text.tradeCount}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.symbol} className="v2-row">
                  <td className="v2-num px-5 py-2.5 text-[12px] text-ink-3">{row.rank}</td>
                  <td className="px-3 py-2.5">
                    <Link href={toPreviewHref(buildTradeHistoryHref({ ...scope, symbol: row.symbol }))} className="v2-link font-medium">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className={`v2-num px-3 py-2.5 text-right font-medium ${row.netPnl >= 0 ? "text-profit" : "text-loss"}`}>
                    {formatMoney(row.netPnl)}
                  </td>
                  <td className={`v2-num px-3 py-2.5 text-right ${row.returnPct === null ? "text-ink-3" : row.returnPct >= 0 ? "text-profit" : "text-loss"}`}>
                    {formatPercent(row.returnPct)}
                  </td>
                  <td className="v2-num px-3 py-2.5 text-right text-ink-2">{row.winRate.toFixed(1)}%</td>
                  <td className="v2-num px-5 py-2.5 text-right text-ink-2">{row.tradeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
