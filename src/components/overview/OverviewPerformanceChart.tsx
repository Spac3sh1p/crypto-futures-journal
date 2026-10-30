"use client";

import { useState } from "react";
import { OverviewCurveChart } from "./OverviewCurveChart";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";

type Point = { date: string; value: number; returnPct?: number };

export function OverviewPerformanceChart({ trades, flows, accounts, sharpe }: {
  trades: Point[]; flows: Point[]; accounts: string[]; sharpe: number | null;
}) {
  const { dictionary } = useI18n();
  const text = dictionary.accounting;
  const [mode, setMode] = useState<"trades" | "flows">("trades");
  return (
    <section className="trading-panel min-w-0 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="terminal-section-title">{mode === "trades" ? text.closedCurve : text.accountCurve}</h2>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["trades", "flows"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}
              className={`rounded px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 ${mode === value ? "bg-yellow text-bg-primary" : "text-text-secondary hover:bg-bg-hover"}`}>
              {value === "trades" ? text.closedCurve : text.accountCurve}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-text-muted">
        {mode === "trades" ? text.closedHint : accounts.length ? template(text.accountHint, { accounts: accounts.join(" / ") }) : text.noFlows}
      </p>
      <OverviewCurveChart data={mode === "trades" ? trades : flows} />
      {mode === "flows" && <p className="mt-3 text-xs text-text-muted" title={text.sharpeHint}>{text.accountSharpe}: <span className="font-mono text-text-secondary">{sharpe === null ? "--" : sharpe.toFixed(2)}</span> · {text.sharpeHint}</p>}
    </section>
  );
}
