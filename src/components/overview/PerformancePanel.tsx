"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import type { CurvePoint } from "@/lib/dashboard/overview-model";
import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Segmented";
import { EquityChart } from "./EquityChart";

export interface OverviewStat {
  label: string;
  value: string;
  sub?: string;
}

export function PerformancePanel({
  headlineLabel,
  headlineValue,
  headlineTone,
  balanceLabel,
  balance,
  stats,
  trades,
  flows,
  accounts,
  sharpe,
}: {
  headlineLabel: string;
  headlineValue: string;
  headlineTone: "profit" | "loss";
  balanceLabel: string;
  /** 余额数字；服务端用 Suspense 包着传进来，会比面板其余部分晚到 */
  balance: ReactNode;
  stats: OverviewStat[];
  trades: CurvePoint[];
  flows: CurvePoint[];
  accounts: string[];
  sharpe: number | null;
}) {
  const { dictionary } = useI18n();
  const text = dictionary.accounting;
  const [mode, setMode] = useState<"trades" | "flows">("trades");
  const hint = mode === "trades"
    ? text.closedHint
    : accounts.length
      ? template(text.accountHint, { accounts: accounts.join(" / ") })
      : text.noFlows;

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
        <div>
          <div className="text-[13px] text-ink-3">{headlineLabel}</div>
          <div className={`ui-figure mt-1 text-[36px] leading-none ${headlineTone === "profit" ? "text-profit" : "text-loss"}`}>
            {headlineValue}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-ink-3">{balanceLabel}</div>
          <div className="ui-num mt-1 text-[15px] text-ink">{balance}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pb-2 pt-5">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "trades", label: text.closedCurve },
            { value: "flows", label: text.accountCurve },
          ]}
        />
        <p className="max-w-3xl text-[12px] leading-5 text-ink-3">{hint}</p>
      </div>

      <div className="overflow-x-auto px-1">
        <EquityChart
          data={mode === "trades" ? trades : flows}
          seriesName={mode === "trades" ? text.closedCurve : text.accountCurve}
          emptyText={dictionary.performance.cumulative.empty}
        />
      </div>

      {mode === "flows" && (
        <p className="px-5 pb-3 text-[12px] text-ink-3" title={text.sharpeHint}>
          {text.accountSharpe}: <span className="ui-num text-ink-2">{sharpe === null ? "--" : sharpe.toFixed(2)}</span>
        </p>
      )}

      <div className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className={`px-5 py-4 ${index > 0 ? "lg:border-l lg:border-line" : ""} ${index % 2 === 1 ? "border-l border-line lg:border-l" : ""}`}>
            <div className="text-[12px] text-ink-3">{stat.label}</div>
            <div className="ui-figure mt-1 text-[20px] leading-7 text-ink">{stat.value}</div>
            {stat.sub && <div className="mt-0.5 text-[12px] text-ink-3">{stat.sub}</div>}
          </div>
        ))}
      </div>
    </Panel>
  );
}
