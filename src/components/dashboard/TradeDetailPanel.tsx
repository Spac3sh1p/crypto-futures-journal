"use client";

import { useState } from "react";
import { MiniKlineChart } from "./MiniKlineChart";

interface TradeDetail {
  id: string;
  symbol: string;
  side: string;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  realizedPnl: number;
  fee: number;
  fundingFee: number;
  holdDuration: number;
  tags: string | null;
  notes: string | null;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function TradeDetailPanel({ trade }: { trade: TradeDetail }) {
  const [activeTab, setActiveTab] = useState<"chart" | "fills" | "notes">("chart");

  const entryDate = new Date(trade.entryTime);
  const exitDate = new Date(trade.exitTime);
  const formatDateTime = (d: Date) =>
    `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })} - ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}`;


  return (
    <div className="bg-bg-primary border-t border-border">
      {/* Tabs */}
      <div className="flex gap-4 px-5 border-b border-border">
        {[
          { id: "chart" as const, label: "Chart Summary" },
          { id: "fills" as const, label: "Fills" },
          { id: "notes" as const, label: "Notes" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-yellow text-yellow"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "chart" && (
        <div className="flex gap-4 p-4">
          {/* Left: Chart */}
          <div className="flex-1 min-w-0">
            <MiniKlineChart
              entryPrice={trade.entryPrice}
              exitPrice={trade.exitPrice}
              entryTime={trade.entryTime}
              exitTime={trade.exitTime}
              side={trade.side}
            />
          </div>

          {/* Right: Metrics */}
          <div className="w-72 space-y-3 flex-shrink-0">
            {/* Funding & Fees */}
            <div className="flex gap-3 text-xs">
              <div className="flex-1 bg-bg-secondary rounded px-3 py-2 border border-border">
                <span className="text-text-muted">Total Funding</span>
                <span className={`float-right font-mono ${trade.fundingFee >= 0 ? "text-green" : "text-red"}`}>
                  {trade.fundingFee >= 0 ? "+" : ""}${trade.fundingFee.toFixed(2)}
                </span>
              </div>
              <div className="flex-1 bg-bg-secondary rounded px-3 py-2 border border-border">
                <span className="text-text-muted">Fees</span>
                <span className="float-right font-mono text-red">-${trade.fee.toFixed(2)}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-bg-secondary rounded p-3 border border-border">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Tags</span>
                <span className="text-text-muted">⚙</span>
              </div>
              <div className="mt-2">
                {trade.tags ? (
                  <div className="flex flex-wrap gap-1">
                    {trade.tags.split(",").map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-bg-tertiary rounded text-[10px] text-text-secondary">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <button className="text-xs text-text-muted hover:text-text-secondary">+ Add Tag</button>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-bg-secondary rounded p-3 border border-border">
              <span className="text-xs text-text-muted">Notes</span>
              <div className="mt-2">
                {trade.notes ? (
                  <p className="text-xs text-text-secondary">{trade.notes}</p>
                ) : (
                  <button className="text-xs text-text-muted hover:text-text-secondary">+ Add Note</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "fills" && (
        <div className="p-4 text-sm text-text-muted">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-text-muted">Type</th>
                <th className="text-right py-2 text-text-muted">Price</th>
                <th className="text-right py-2 text-text-muted">Qty</th>
                <th className="text-right py-2 text-text-muted">Fee</th>
                <th className="text-right py-2 text-text-muted">Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-light">
                <td className="py-2 text-green">Open</td>
                <td className="py-2 text-right font-mono">${trade.entryPrice.toFixed(4)}</td>
                <td className="py-2 text-right font-mono">—</td>
                <td className="py-2 text-right font-mono text-red">-${(trade.fee * 0.5).toFixed(2)}</td>
                <td className="py-2 text-right font-mono">{formatDateTime(entryDate)}</td>
              </tr>
              <tr>
                <td className="py-2 text-red">Close</td>
                <td className="py-2 text-right font-mono">${trade.exitPrice.toFixed(4)}</td>
                <td className="py-2 text-right font-mono">—</td>
                <td className="py-2 text-right font-mono text-red">-${(trade.fee * 0.5).toFixed(2)}</td>
                <td className="py-2 text-right font-mono">{formatDateTime(exitDate)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="p-4">
          <div className="bg-bg-secondary rounded p-4 border border-border min-h-[120px]">
            {trade.notes ? (
              <p className="text-sm text-text-secondary">{trade.notes}</p>
            ) : (
              <p className="text-sm text-text-muted italic">No notes yet. Click to add notes about this trade.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
