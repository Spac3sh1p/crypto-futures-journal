"use client";

import { useState, useCallback, useEffect } from "react";
import { useTradeNavigation } from "./TradeNavigationGuard";
import { MiniKlineChart } from "./MiniKlineChart";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import { formatMoney, formatTradeDateTimeParts } from "@/lib/formatters";

import type { AccountingStatus } from "@/lib/dashboard/trade-accounting";

interface TradeDetail {
  accountingStatus?: AccountingStatus;
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
const PRESET_TAG_KEYS = [
  "breakout", "scalp", "swing", "reversal", "trend",
  "news", "overtraded", "fomo", "revenge", "perfectSetup",
  "earlyExit", "lateEntry", "stoppedOut", "tpHit",
] as const;

const DETAIL_TABS = ["chart", "fills", "notes"] as const;

export function TradeDetailPanel({ trade, onTradeUpdated, onDirtyChange }: {
  trade: TradeDetail;
  onTradeUpdated?: (id: string, changes: { notes?: string | null; tags?: string | null }) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.tradeDetail;
  const { setBlocked: setNavigationBlocked } = useTradeNavigation();
  const [activeTab, setActiveTab] = useState<"chart" | "fills" | "notes">("chart");
  const [statusMessage, setStatusMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

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

  const entryDateTime = formatTradeDateTimeParts(trade.entryTime, locale);
  const exitDateTime = formatTradeDateTimeParts(trade.exitTime, locale);
  const tabId = (tab: string) => `trade-${trade.id}-${tab}-tab`;
  const panelId = (tab: string) => `trade-${trade.id}-${tab}-panel`;

  const dirty = (editingNotes && notesDraft !== notes) || newTag.trim().length > 0 || noteSaving || tagSaving;
  useEffect(() => {
    onDirtyChange?.(dirty);
    setNavigationBlocked(dirty);
    const handleUnload = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => { window.removeEventListener("beforeunload", handleUnload); onDirtyChange?.(false); setNavigationBlocked(false); };
  }, [dirty, onDirtyChange, setNavigationBlocked]);

  // Save tags to API
  const saveTags = useCallback(async (newTags: string[]) => {
    if (editingNotes && notesDraft !== notes) {
      setStatusMessage({ text: dictionary.tradeFilters.unsaved, tone: "error" });
      return false;
    }
    setTagSaving(true);
    setStatusMessage(null);
    try {
      const tagsStr = newTags.length > 0 ? newTags.join(",") : null;
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tagsStr }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save tags");
      }
      setTags(newTags);
      onTradeUpdated?.(trade.id, { tags: tagsStr });
      setStatusMessage({ text: text.tagsSaved, tone: "success" });
      return true;
    } catch {
      setStatusMessage({ text: text.tagsSaveFailed, tone: "error" });
      return false;
    } finally {
      setTagSaving(false);
    }
  }, [dictionary.tradeFilters.unsaved, editingNotes, notesDraft, notes, onTradeUpdated, text.tagsSaveFailed, text.tagsSaved, trade.id]);

  // Add a tag
  const addTag = useCallback(async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed) || tagSaving) return;
    const updated = [...tags, trimmed];
    if (await saveTags(updated)) {
      setNewTag("");
      setShowTagInput(false);
    }
  }, [tags, tagSaving, saveTags]);

  // Remove a tag
  const removeTag = useCallback(async (tag: string) => {
    const updated = tags.filter((t) => t !== tag);
    await saveTags(updated);
  }, [tags, saveTags]);

  // Save notes to API
  const saveNotes = useCallback(async () => {
    setNoteSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save notes");
      }
      setNotes(notesDraft);
      onTradeUpdated?.(trade.id, { notes: notesDraft || null });
      setEditingNotes(false);
      setStatusMessage({ text: text.notesSaved, tone: "success" });
    } catch {
      setStatusMessage({ text: text.notesSaveFailed, tone: "error" });
    } finally {
      setNoteSaving(false);
    }
  }, [onTradeUpdated, notesDraft, text.notesSaveFailed, text.notesSaved, trade.id]);

  return (
    <div className="border-t border-border bg-[#08111D]">
      {trade.accountingStatus && <p className="px-5 pt-3 text-xs text-text-muted">{dictionary.accounting.title} · <span className={trade.accountingStatus === "needs-review" ? "text-yellow" : "text-text-secondary"}>{dictionary.accounting[trade.accountingStatus]}</span></p>}
      {dirty && <p role="status" className="px-5 pt-3 text-xs text-yellow">{dictionary.tradeFilters.unsaved}</p>}
      {/* Tabs */}
      <div className="flex gap-5 border-b border-border px-5" role="tablist">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab}
            id={tabId(tab)}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={panelId(tab)}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => {
              const current = DETAIL_TABS.indexOf(tab);
              const next = event.key === "ArrowRight" ? (current + 1) % DETAIL_TABS.length
                : event.key === "ArrowLeft" ? (current + DETAIL_TABS.length - 1) % DETAIL_TABS.length
                : event.key === "Home" ? 0 : event.key === "End" ? DETAIL_TABS.length - 1 : -1;
              if (next < 0) return;
              event.preventDefault();
              setActiveTab(DETAIL_TABS[next]);
              document.getElementById(tabId(DETAIL_TABS[next]))?.focus();
            }}
            className={`border-b-2 py-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 ${
              activeTab === tab
                ? "border-yellow text-yellow"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {text.tabs[tab]}
          </button>
        ))}
      </div>

      {statusMessage && (
        <div
          role="status"
          className={`border-b border-border px-5 py-2 text-xs font-medium ${
            statusMessage.tone === "success" ? "text-green" : "text-red"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Content */}
      {activeTab === "chart" && (
        <div
          id={panelId("chart")}
          role="tabpanel"
          aria-labelledby={tabId("chart")}
          className="flex flex-col gap-4 p-4 xl:flex-row"
        >
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
          <div className="w-full flex-shrink-0 space-y-3 xl:w-72">
            {/* Funding & Fees */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-bg-tertiary/82 px-3 py-3">
                <span className="block font-medium text-text-secondary">{text.totalFunding}</span>
                <span className={`mt-1 block text-right font-mono font-semibold tabular-nums ${trade.fundingFee >= 0 ? "text-green" : "text-red"}`}>
                  {formatMoney(trade.fundingFee)}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-bg-tertiary/82 px-3 py-3">
                <span className="block font-medium text-text-secondary">{text.fees}</span>
                <span className="mt-1 block text-right font-mono font-semibold tabular-nums text-red">{formatMoney(-Math.abs(trade.fee))}</span>
              </div>
            </div>

            {/* Tags - Interactive */}
            <div className="rounded-lg border border-border bg-bg-tertiary/82 p-3">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-text-secondary">{text.tags}</span>
                <button
                  type="button"
                  onClick={() => setShowTagManager(!showTagManager)}
                  aria-label={text.manageTags}
                  aria-pressed={showTagManager}
                  className="rounded text-text-muted transition-colors hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
                  title={text.manageTags}
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
                      <span key={tag} className="inline-flex items-center gap-1 rounded border border-border-light bg-bg-primary px-2 py-0.5 text-[11px] text-text-secondary">
                        {tag}
                        <button
                          type="button"
                          aria-label={template(text.removeTag, { tag })}
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 text-text-muted transition-colors hover:text-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/50"
                          disabled={tagSaving}
                        >
                          x
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
                      aria-label={text.newTagAria}
                      placeholder={text.tagNamePlaceholder}
                      autoFocus
                      className="flex-1 rounded border border-border bg-bg-primary px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted/50 focus:border-yellow focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newTag)}
                      disabled={!newTag.trim() || tagSaving}
                      className="px-2 py-1 text-[10px] font-medium text-bg-primary bg-yellow rounded hover:brightness-110 disabled:opacity-40 transition-all"
                    >
                      {tagSaving ? "..." : dictionary.common.add}
                    </button>
                    <button
                      type="button"
                      aria-label={text.cancelAddTag}
                      onClick={() => { setShowTagInput(false); setNewTag(""); }}
                      className="px-1.5 py-1 text-[11px] text-text-muted hover:text-text-secondary"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className="text-xs font-medium text-text-secondary transition-colors hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
                  >
                    {text.addTag}
                  </button>
                )}

                {/* Tag manager: preset quick-add */}
                {showTagManager && (
                  <div className="mt-2 pt-2 border-t border-border-light">
                    <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">{text.quickAdd}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {PRESET_TAG_KEYS
                        .map((key) => text.presetTags[key])
                        .filter((preset) => !tags.includes(preset))
                        .map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => addTag(preset)}
                          disabled={tagSaving}
                          className="rounded border border-border-light bg-bg-primary px-2 py-0.5 text-[11px] font-medium text-text-secondary transition-all hover:border-yellow/40 hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 disabled:opacity-40"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes - Interactive */}
            <div className="rounded-lg border border-border bg-bg-tertiary/82 p-3">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-text-secondary">{text.notes}</span>
                {notes && !editingNotes && (
                  <button
                    type="button"
                    aria-label={text.editNotes}
                    onClick={() => { setEditingNotes(true); setNotesDraft(notes); }}
                    className="rounded text-text-muted transition-colors hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
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
                      disabled={noteSaving}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder={text.notePlaceholder}
                      aria-label={text.noteAria}
                      autoFocus
                      rows={4}
                      className="w-full resize-none rounded-lg border border-border bg-bg-primary px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/50 focus:border-yellow focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={saveNotes}
                        disabled={noteSaving}
                        className="rounded-lg bg-yellow px-3 py-1.5 text-[11px] font-medium text-bg-primary transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 disabled:opacity-50"
                      >
                        {noteSaving ? dictionary.common.saving : dictionary.common.save}
                      </button>
                      <button
                        type="button"
                        disabled={noteSaving}
                        onClick={() => { setEditingNotes(false); setNotesDraft(notes); }}
                        className="rounded-lg border border-border px-3 py-1.5 text-[11px] text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
                      >
                        {dictionary.common.cancel}
                      </button>
                    </div>
                  </div>
                ) : notes ? (
                  <p
                    className="cursor-pointer whitespace-pre-wrap text-xs text-text-secondary transition-colors hover:text-text-primary"
                    onClick={() => { setEditingNotes(true); setNotesDraft(notes); }}
                  >
                    {notes}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditingNotes(true); setNotesDraft(""); }}
                    className="text-xs font-medium text-text-secondary transition-colors hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
                  >
                    {text.addNote}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "fills" && (
        <div
          id={panelId("fills")}
          role="tabpanel"
          aria-labelledby={tabId("fills")}
          className="overflow-x-auto p-4 text-sm text-text-muted"
        >
          <p className="mb-3 text-xs leading-relaxed">{template(dictionary.accounting.fillHint, { fee: formatMoney(-Math.abs(trade.fee)) })}</p>
          <table className="w-full min-w-[560px] text-xs">
            <caption className="sr-only">{text.fillsCaption}</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="text-left py-2 text-text-muted">{dictionary.common.type}</th>
                <th scope="col" className="text-right py-2 text-text-muted">{dictionary.common.price}</th>
                <th scope="col" className="text-right py-2 text-text-muted">{dictionary.common.qty}</th>
                <th scope="col" className="text-right py-2 text-text-muted">{dictionary.common.fee}</th>
                <th scope="col" className="text-right py-2 text-text-muted">{dictionary.common.time}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-light">
                <td className="py-2 text-green">{text.open}</td>
                <td className="py-2 text-right font-mono">${trade.entryPrice.toFixed(4)}</td>
                <td className="py-2 text-right font-mono">--</td>
                <td className="py-2 text-right font-mono text-red">--</td>
                <td className="py-2 text-right font-mono">{entryDateTime.full}</td>
              </tr>
              <tr>
                <td className="py-2 text-red">{text.close}</td>
                <td className="py-2 text-right font-mono">${trade.exitPrice.toFixed(4)}</td>
                <td className="py-2 text-right font-mono">--</td>
                <td className="py-2 text-right font-mono text-red">--</td>
                <td className="py-2 text-right font-mono">{exitDateTime.full}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "notes" && (
        <div
          id={panelId("notes")}
          role="tabpanel"
          aria-labelledby={tabId("notes")}
          className="p-4"
        >
          <div className="min-h-[120px] rounded-lg border border-border bg-bg-tertiary/82 p-4">
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notesDraft}
                  disabled={noteSaving}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder={text.noteLongPlaceholder}
                  aria-label={text.noteAria}
                  autoFocus
                  rows={5}
                  className="w-full resize-none rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-yellow focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveNotes}
                    disabled={noteSaving}
                    className="rounded-lg bg-yellow px-4 py-2 text-xs font-medium text-bg-primary transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 disabled:opacity-50"
                  >
                    {noteSaving ? dictionary.common.saving : text.saveNotes}
                  </button>
                  <button
                    type="button"
                    disabled={noteSaving}
                    onClick={() => { setEditingNotes(false); setNotesDraft(notes); }}
                    className="rounded-lg border border-border px-4 py-2 text-xs text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
                  >
                    {dictionary.common.cancel}
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
                type="button"
                onClick={() => { setEditingNotes(true); setNotesDraft(""); }}
                className="text-sm font-medium text-text-secondary transition-colors hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
              >
                {text.addNotePlain}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
