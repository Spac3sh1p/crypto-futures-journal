"use client";

import { useState, useCallback } from "react";
import { MiniKlineChart } from "./MiniKlineChart";

interface TradeDetail {
  id: string;
  exchangeName: string;
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

// Predefined tag options for quick selection
const PRESET_TAGS = [
  "Breakout", "Scalp", "Swing", "Reversal", "Trend",
  "News", "Overtraded", "FOMO", "Revenge", "Perfect Setup",
  "Early Exit", "Late Entry", "Stopped Out", "TP Hit",
];

export function TradeDetailPanel({ trade }: { trade: TradeDetail }) {
  const [activeTab, setActiveTab] = useState<"chart" | "fills" | "notes">("chart");

  // Tags state
  const [tags, setTags] = useState<string[]>(
    trade.tags ? trade.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
  );
  const [showTagInput, setShowTagInput] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tagSaving, setTagSaving] = useState(false);

  // Notes state
  const [notes, setNotes] = useState(trade.notes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(trade.notes || "");
  const [noteSaving, setNoteSaving] = useState(false);

  const entryDate = new Date(trade.entryTime);
  const exitDate = new Date(trade.exitTime);
  const formatDateTime = (d: Date) =>
    `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })} - ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}`;

  // Save tags to API
  const saveTags = useCallback(async (newTags: string[]) => {
    setTagSaving(true);
    try {
      const tagsStr = newTags.length > 0 ? newTags.join(",") : null;
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tagsStr }),
      });
      const json = await res.json();
      if (json.success) {
        setTags(newTags);
      }
    } catch (err) {
      console.error("Failed to save tags:", err);
    } finally {
      setTagSaving(false);
    }
  }, [trade.id]);

  // Add a tag
  const addTag = useCallback(async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const updated = [...tags, trimmed];
    await saveTags(updated);
    setNewTag("");
    setShowTagInput(false);
  }, [tags, saveTags]);

  // Remove a tag
  const removeTag = useCallback(async (tag: string) => {
    const updated = tags.filter((t) => t !== tag);
    await saveTags(updated);
  }, [tags, saveTags]);

  // Save notes to API
  const saveNotes = useCallback(async () => {
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft || null }),
      });
      const json = await res.json();
      if (json.success) {
        setNotes(notesDraft);
        setEditingNotes(false);
      }
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setNoteSaving(false);
    }
  }, [trade.id, notesDraft]);

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
              exchangeName={trade.exchangeName}
              symbol={trade.symbol}
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
                <span className="font-medium text-text-secondary">Total Funding</span>
                <span className={`float-right font-mono font-semibold tabular-nums ${trade.fundingFee >= 0 ? "text-green" : "text-red"}`}>
                  {trade.fundingFee >= 0 ? "+" : ""}${trade.fundingFee.toFixed(2)}
                </span>
              </div>
              <div className="flex-1 bg-bg-secondary rounded px-3 py-2 border border-border">
                <span className="font-medium text-text-secondary">Fees</span>
                <span className="float-right font-mono font-semibold tabular-nums text-red">-${trade.fee.toFixed(2)}</span>
              </div>
            </div>

            {/* Tags — Interactive */}
            <div className="bg-bg-secondary rounded p-3 border border-border">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-text-secondary">Tags</span>
                <button
                  onClick={() => setShowTagManager(!showTagManager)}
                  className="text-text-muted hover:text-yellow transition-colors"
                  title="Manage tags"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                </button>
              </div>
              <div className="mt-2">
                {/* Existing tags with remove button */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary rounded text-[11px] text-text-secondary border border-border-light">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-text-muted hover:text-red transition-colors ml-0.5"
                          disabled={tagSaving}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add tag input */}
                {showTagInput ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTag(newTag);
                        if (e.key === "Escape") { setShowTagInput(false); setNewTag(""); }
                      }}
                      placeholder="Tag name..."
                      autoFocus
                      className="flex-1 bg-bg-tertiary border border-border rounded px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted/50 focus:border-yellow focus:outline-none"
                    />
                    <button
                      onClick={() => addTag(newTag)}
                      disabled={!newTag.trim() || tagSaving}
                      className="px-2 py-1 text-[10px] font-medium text-bg-primary bg-yellow rounded hover:brightness-110 disabled:opacity-40 transition-all"
                    >
                      {tagSaving ? "..." : "Add"}
                    </button>
                    <button
                      onClick={() => { setShowTagInput(false); setNewTag(""); }}
                      className="px-1.5 py-1 text-[11px] text-text-muted hover:text-text-secondary"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="text-xs font-medium text-text-secondary hover:text-yellow transition-colors"
                  >
                    + Add Tag
                  </button>
                )}

                {/* Tag manager: preset quick-add */}
                {showTagManager && (
                  <div className="mt-2 pt-2 border-t border-border-light">
                    <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Quick Add</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {PRESET_TAGS.filter((t) => !tags.includes(t)).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => addTag(preset)}
                          disabled={tagSaving}
                          className="px-2 py-0.5 text-[11px] font-medium text-text-secondary bg-bg-tertiary border border-border-light rounded hover:border-yellow/40 hover:text-yellow transition-all disabled:opacity-40"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes — Interactive */}
            <div className="bg-bg-secondary rounded p-3 border border-border">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-text-secondary">Notes</span>
                {notes && !editingNotes && (
                  <button
                    onClick={() => { setEditingNotes(true); setNotesDraft(notes); }}
                    className="text-text-muted hover:text-yellow transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="mt-2">
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Write your trade notes here..."
                      autoFocus
                      rows={4}
                      className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/50 focus:border-yellow focus:outline-none resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveNotes}
                        disabled={noteSaving}
                        className="px-3 py-1.5 text-[11px] font-medium text-bg-primary bg-yellow rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
                      >
                        {noteSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingNotes(false); setNotesDraft(notes); }}
                        className="px-3 py-1.5 text-[11px] text-text-muted hover:text-text-secondary border border-border rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : notes ? (
                  <p
                    className="text-xs text-text-secondary cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => { setEditingNotes(true); setNotesDraft(notes); }}
                  >
                    {notes}
                  </p>
                ) : (
                  <button
                    onClick={() => { setEditingNotes(true); setNotesDraft(""); }}
                    className="text-xs font-medium text-text-secondary hover:text-yellow transition-colors"
                  >
                    + Add Note
                  </button>
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
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Write your trade notes, analysis, lessons learned..."
                  autoFocus
                  rows={5}
                  className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-yellow focus:outline-none resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveNotes}
                    disabled={noteSaving}
                    className="px-4 py-2 text-xs font-medium text-bg-primary bg-yellow rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {noteSaving ? "Saving..." : "Save Notes"}
                  </button>
                  <button
                    onClick={() => { setEditingNotes(false); setNotesDraft(notes); }}
                    className="px-4 py-2 text-xs text-text-muted hover:text-text-secondary border border-border rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : notes ? (
              <p
                className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors whitespace-pre-wrap"
                onClick={() => { setEditingNotes(true); setNotesDraft(notes); }}
              >
                {notes}
              </p>
            ) : (
              <button
                onClick={() => { setEditingNotes(true); setNotesDraft(""); }}
                className="text-sm text-text-muted italic hover:text-yellow transition-colors"
              >
                No notes yet. Click to add notes about this trade.
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
