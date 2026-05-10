import type { SymbolReport } from "@/lib/dashboard/analytics-transforms";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

export function SymbolsReport({ data }: { data: SymbolReport[] }) {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Traded Symbols Report</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left text-xs text-text-muted">Symbol</th>
              <th className="px-4 py-2 text-center text-xs text-text-muted">Trade Count</th>
              <th className="px-4 py-2 text-center text-xs text-text-muted">Win Rate</th>
              <th className="px-4 py-2 text-center text-xs text-text-muted">Long Vs Short</th>
              <th className="px-4 py-2 text-center text-xs text-text-muted">Avg Trade Duration</th>
              <th className="px-4 py-2 text-right text-xs text-text-muted">Avg Gain</th>
              <th className="px-4 py-2 text-right text-xs text-text-muted">Total Gain</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.symbol} className="border-b border-border-light hover:bg-bg-hover transition-colors">
                <td className="px-4 py-3 font-mono text-text-primary text-xs">{row.symbol}</td>
                <td className="px-4 py-3 text-center font-mono text-text-primary text-xs">{row.tradeCount}</td>
                <td className="px-4 py-3 text-center font-mono text-text-primary text-xs">{row.winRate.toFixed(0)}%</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="flex h-3 w-24 rounded overflow-hidden">
                      <div className="bg-green" style={{ width: `${row.longPercent}%` }} />
                      <div className="bg-red" style={{ width: `${row.shortPercent}%` }} />
                    </div>
                    <span className="text-[9px] text-text-muted">
                      {row.longPercent.toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-red">
                      {row.shortPercent.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    row.avgDuration > 14400 ? "bg-green/20 text-green" : row.avgDuration > 3600 ? "bg-yellow/20 text-yellow" : "bg-red/20 text-red"
                  }`}>
                    {formatDuration(row.avgDuration)}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-mono text-xs ${row.avgGain >= 0 ? "text-green" : "text-red"}`}>
                  {row.avgGain >= 0 ? "+" : ""}${row.avgGain.toFixed(2)}
                </td>
                <td className={`px-4 py-3 text-right font-mono text-xs ${row.totalGain >= 0 ? "text-green" : "text-red"}`}>
                  {row.totalGain >= 0 ? "+" : ""}${row.totalGain.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
