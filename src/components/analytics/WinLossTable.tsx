import type { WinLossRow } from "@/lib/dashboard/analytics-transforms";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

interface WinLossTableProps {
  title: string;
  rows: WinLossRow[];
  isWin: boolean;
}

export function WinLossTable({ title, rows, isWin }: WinLossTableProps) {
  const borderColor = isWin ? "border-t-green" : "border-t-red";
  const valueColor = isWin ? "text-green" : "text-red";

  return (
    <div className={`bg-bg-secondary rounded-lg border border-border border-t-4 ${borderColor}`}>
      <div className="px-5 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-5 py-2 text-left text-xs text-text-muted">Type</th>
            <th className="px-5 py-2 text-center text-xs text-text-muted">No. of trades</th>
            <th className="px-5 py-2 text-center text-xs text-text-muted">Avg Duration</th>
            <th className="px-5 py-2 text-center text-xs text-text-muted">Avg Size</th>
            <th className="px-5 py-2 text-right text-xs text-text-muted">{isWin ? "Avg Gain" : "Avg Loss"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.type} className="border-b border-border-light">
              <td className={`px-5 py-3 text-xs font-medium ${row.type === "Long" ? "text-green" : row.type === "Short" ? "text-red" : "text-text-primary"}`}>
                {row.type}
              </td>
              <td className="px-5 py-3 text-center text-xs font-mono text-text-primary">{row.count}</td>
              <td className="px-5 py-3 text-center text-xs font-mono text-text-secondary">{formatDuration(row.avgDuration)}</td>
              <td className="px-5 py-3 text-center text-xs font-mono text-text-secondary">
                ${row.avgSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </td>
              <td className={`px-5 py-3 text-right text-xs font-mono ${valueColor}`}>
                {isWin ? "+" : "-"}${Math.abs(row.avgGainLoss).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
