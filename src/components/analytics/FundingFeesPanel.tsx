import type { FundingReport, FeesReport } from "@/lib/dashboard/analytics-transforms";

export function FundingFeesPanel({ funding, fees }: { funding: FundingReport; fees: FeesReport }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Funding */}
      <div className="bg-bg-secondary rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Funding</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-muted">Type</th>
              <th className="text-right py-2 text-text-muted">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-light">
              <td className="py-2 text-green">Funding Received</td>
              <td className="py-2 text-right font-mono text-green">+${funding.received.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 text-red">Funding Paid</td>
              <td className="py-2 text-right font-mono text-red">-${funding.paid.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-2 text-text-primary font-medium">Net Funding</td>
              <td className={`py-2 text-right font-mono ${funding.net >= 0 ? "text-green" : "text-red"}`}>
                {funding.net >= 0 ? "+" : "-"}${Math.abs(funding.net).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Fees */}
      <div className="bg-bg-secondary rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Fees</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-muted">Type</th>
              <th className="text-right py-2 text-text-muted">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-light">
              <td className="py-2 text-red">Taker Fees</td>
              <td className="py-2 text-right font-mono text-red">-${fees.marketFeesPaid.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 text-green">Maker Fees</td>
              <td className="py-2 text-right font-mono text-green">${fees.makerRebates.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-2 text-text-primary font-medium">Net Fees</td>
              <td className={`py-2 text-right font-mono ${fees.net >= 0 ? "text-green" : "text-red"}`}>
                {fees.net >= 0 ? "+" : "-"}${Math.abs(fees.net).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
