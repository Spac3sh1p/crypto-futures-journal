"use client";

import type { FeesReport, FundingReport } from "@/lib/dashboard/analytics-transforms";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Panel, PanelHeader } from "@/components/v2/ui/Panel";

interface FeeRow {
  label: string;
  value: string;
  tone: "profit" | "loss" | "neutral";
  emphasis?: boolean;
}

function FeeTable({ title, rows, typeLabel, totalLabel }: { title: string; rows: FeeRow[]; typeLabel: string; totalLabel: string }) {
  return (
    <Panel>
      <PanelHeader title={title} />
      <table className="w-full">
        <thead>
          <tr>
            <th className="px-5 py-2.5 text-left text-[12px] font-normal text-ink-3">{typeLabel}</th>
            <th className="px-5 py-2.5 text-right text-[12px] font-normal text-ink-3">{totalLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-line">
              <td className={`px-5 py-2.5 text-[13px] ${row.emphasis ? "font-medium text-ink" : "text-ink-2"}`}>{row.label}</td>
              <td className={`v2-num px-5 py-2.5 text-right text-[13px] ${row.emphasis ? "font-medium" : ""} ${row.tone === "profit" ? "text-profit" : row.tone === "loss" ? "text-loss" : "text-ink"}`}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;
}

export function FundingFeesV2({ funding, fees }: { funding: FundingReport; fees: FeesReport }) {
  const { dictionary } = useI18n();
  const reports = dictionary.analytics.reports;
  const fundingText = dictionary.analytics.funding;
  const feesText = dictionary.analytics.fees;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <FeeTable
        title={reports.fundingTitle}
        typeLabel={dictionary.common.type}
        totalLabel={dictionary.common.total}
        rows={[
          { label: fundingText.received, value: `+$${funding.received.toFixed(2)}`, tone: "profit" },
          { label: fundingText.paid, value: `-$${funding.paid.toFixed(2)}`, tone: "loss" },
          { label: fundingText.net, value: signed(funding.net), tone: funding.net >= 0 ? "profit" : "loss", emphasis: true },
        ]}
      />
      <FeeTable
        title={reports.feesTitle}
        typeLabel={dictionary.common.type}
        totalLabel={dictionary.common.total}
        rows={[
          { label: feesText.taker, value: `-$${fees.marketFeesPaid.toFixed(2)}`, tone: "loss" },
          { label: feesText.maker, value: `$${fees.makerRebates.toFixed(2)}`, tone: "profit" },
          { label: feesText.net, value: signed(fees.net), tone: fees.net >= 0 ? "profit" : "loss", emphasis: true },
        ]}
      />
    </div>
  );
}
