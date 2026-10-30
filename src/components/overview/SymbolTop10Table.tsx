import { TradeNavigationLink as Link } from "@/components/dashboard/TradeNavigationGuard";
import { buildTradeHistoryHref, type TradeHistoryScope } from "@/lib/dashboard/trade-history-routing";
import type { SymbolTop10Report } from "@/lib/dashboard/analytics-transforms";
import { formatMoney } from "@/lib/formatters";
import type { Dictionary } from "@/lib/i18n";

type SymbolTop10Text = Dictionary["overview"]["symbolTop10"];

function formatPercent(value: number | null): string {
  if (value === null) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function rankClass(rank: number): string {
  return rank <= 3 ? "text-yellow" : "text-text-muted";
}

export function SymbolTop10Table({
  data,
  text,
  scope,
}: {
  data: SymbolTop10Report[];
  text: SymbolTop10Text;
  scope?: TradeHistoryScope;
}) {
  return (
    <section className="trading-panel overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="terminal-section-title">{text.title}</h3>
        <p className="mt-1 text-xs font-medium text-text-muted">{text.subtitle}</p>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm font-medium text-text-muted">{text.empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary/50 text-[11px] font-semibold text-text-muted">
                <th className="w-12 px-4 py-2.5 text-left">{text.rank}</th>
                <th className="px-4 py-2.5 text-left">{text.symbol}</th>
                <th className="px-4 py-2.5 text-right">{text.netPnl}</th>
                <th className="px-4 py-2.5 text-center">{text.returnRate}</th>
                <th className="px-4 py-2.5 text-center">{text.winRate}</th>
                <th className="px-4 py-2.5 text-right">{text.tradeCount}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const pnlTone = row.netPnl >= 0 ? "text-green" : "text-red";
                const returnTone = row.returnPct === null
                  ? "text-text-muted"
                  : row.returnPct >= 0
                    ? "text-green"
                    : "text-red";

                return (
                  <tr key={row.symbol} className="border-b border-border-light transition-colors hover:bg-bg-hover/52">
                    <td className={`px-4 py-3.5 font-mono text-xs font-bold tabular-nums ${rankClass(row.rank)}`}>
                      {row.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={buildTradeHistoryHref({ ...scope, symbol: row.symbol })} className="rounded font-mono text-[13px] font-semibold text-text-primary underline decoration-border underline-offset-4 hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60">{row.symbol}</Link>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-mono text-[13px] font-bold tabular-nums ${pnlTone}`}>
                      {formatMoney(row.netPnl)}
                    </td>
                    <td className={`px-4 py-3.5 text-center font-mono text-[13px] font-bold tabular-nums ${returnTone}`}>
                      {formatPercent(row.returnPct)}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-[13px] font-semibold text-text-secondary tabular-nums">
                      {row.winRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[13px] font-semibold text-text-secondary tabular-nums">
                      {row.tradeCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
