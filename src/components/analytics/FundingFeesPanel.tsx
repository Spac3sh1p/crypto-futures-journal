"use client";

import type { FundingReport, FeesReport } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";

export function FundingFeesPanel({ funding, fees }: { funding: FundingReport; fees: FeesReport }) {
  const { dictionary } = useI18n();
  const reports = dictionary.analytics.reports;
  const fundingText = dictionary.analytics.funding;
  const feesText = dictionary.analytics.fees;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Funding */}
      <div className="trading-panel p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">{reports.fundingTitle}</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-muted">{dictionary.common.type}</th>
              <th className="text-right py-2 text-text-muted">{dictionary.common.total}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-light">
              <td className="py-2 text-green">{fundingText.received}</td>
              <td className="py-2 text-right font-mono text-green">+${funding.received.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 text-red">{fundingText.paid}</td>
              <td className="py-2 text-right font-mono text-red">-${funding.paid.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-2 text-text-primary font-medium">{fundingText.net}</td>
              <td className={`py-2 text-right font-mono ${funding.net >= 0 ? "text-green" : "text-red"}`}>
                {funding.net >= 0 ? "+" : "-"}${Math.abs(funding.net).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Fees */}
      <div className="trading-panel p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">{reports.feesTitle}</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-muted">{dictionary.common.type}</th>
              <th className="text-right py-2 text-text-muted">{dictionary.common.total}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-light">
              <td className="py-2 text-red">{feesText.taker}</td>
              <td className="py-2 text-right font-mono text-red">-${fees.marketFeesPaid.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 text-green">{feesText.maker}</td>
              <td className="py-2 text-right font-mono text-green">${fees.makerRebates.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-2 text-text-primary font-medium">{feesText.net}</td>
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
