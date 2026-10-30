"use client";

import { useState, useCallback, useEffect } from "react";
import { useTradeNavigation } from "@/components/dashboard/TradeNavigationGuard";
import { MiniKlineChart } from "@/components/dashboard/MiniKlineChart";
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

const PRESET_TAG_KEYS = [
  "breakout", "scalp", "swing", "reversal", "trend",
  "news", "overtraded", "fomo", "revenge", "perfectSetup",
  "earlyExit", "lateEntry", "stoppedOut", "tpHit",
] as const;

const DETAIL_TABS = ["chart", "fills", "notes"] as const;

function IconPencil() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

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

  const [tags, setTags] = useState<string[]>(
    trade.tags ? trade.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
  );
  const [showTagInput, setShowTagInput] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tagSaving, setTagSaving] = useState(false);

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

  const addTag = useCallback(async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed) || tagSaving) return;
    const updated = [...tags, trimmed];
    if (await saveTags(updated)) {
      setNewTag("");
      setShowTagInput(false);
    }
  }, [tags, tagSaving, saveTags]);

  const removeTag = useCallback(async (tag: string) => {
    await saveTags(tags.filter((t) => t !== tag));
  }, [tags, saveTags]);

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

  const notesEditor = (rows: number, placeholder: string, saveLabel: string) => (
    <div className="space-y-2">
      <textarea
        value={notesDraft}
        disabled={noteSaving}
        onChange={(e) => setNotesDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={text.noteAria}
        autoFocus
        rows={rows}
        className="ui-field h-auto w-full resize-none py-2 text-[13px] leading-5"
      />
      <div className="flex items-center gap-2">
        <button type="button" onClick={saveNotes} disabled={noteSaving} className="ui-button ui-button-primary h-8">
          {noteSaving ? dictionary.common.saving : saveLabel}
        </button>
        <button type="button" disabled={noteSaving} onClick={() => { setEditingNotes(false); setNotesDraft(notes); }} className="ui-button h-8">
          {dictionary.common.cancel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-canvas">
      {(trade.accountingStatus || dirty) && (
        <div className="flex flex-wrap gap-x-6 px-5 pt-3 text-[12px] text-ink-3">
          {trade.accountingStatus && (
            <span>{dictionary.accounting.title}: <span className={trade.accountingStatus === "needs-review" ? "text-accent" : "text-ink-2"}>{dictionary.accounting[trade.accountingStatus]}</span></span>
          )}
          {dirty && <span role="status" className="text-accent">{dictionary.tradeFilters.unsaved}</span>}
        </div>
      )}

      <div className="flex gap-6 border-b border-line px-5" role="tablist">
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
            className={`ui-link -mb-px border-b-2 py-3 text-[13px] font-medium no-underline transition-colors ${
              activeTab === tab ? "border-accent text-ink" : "border-transparent text-ink-3 hover:text-ink-2"
            }`}
          >
            {text.tabs[tab]}
          </button>
        ))}
      </div>

      {statusMessage && (
        <div role="status" className={`border-b border-line px-5 py-2 text-[12px] ${statusMessage.tone === "success" ? "text-profit" : "text-loss"}`}>
          {statusMessage.text}
        </div>
      )}

      {activeTab === "chart" && (
        <div id={panelId("chart")} role="tabpanel" aria-labelledby={tabId("chart")} className="flex flex-col gap-4 p-5 xl:flex-row">
          <div className="min-w-0 flex-1">
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

          <div className="w-full shrink-0 space-y-3 xl:w-72">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-line-strong bg-surface px-3 py-2.5">
                <span className="block text-[12px] text-ink-3">{text.totalFunding}</span>
                <span className={`ui-num mt-1 block text-[14px] font-medium ${trade.fundingFee >= 0 ? "text-profit" : "text-loss"}`}>{formatMoney(trade.fundingFee)}</span>
              </div>
              <div className="rounded-md border border-line-strong bg-surface px-3 py-2.5">
                <span className="block text-[12px] text-ink-3">{text.fees}</span>
                <span className="ui-num mt-1 block text-[14px] font-medium text-loss">{formatMoney(-Math.abs(trade.fee))}</span>
              </div>
            </div>

            <div className="rounded-md border border-line-strong bg-surface p-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-ink-3">{text.tags}</span>
                <button
                  type="button"
                  onClick={() => setShowTagManager(!showTagManager)}
                  aria-label={text.manageTags}
                  aria-pressed={showTagManager}
                  title={text.manageTags}
                  className={`ui-link no-underline ${showTagManager ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
                >
                  {text.quickAdd}
                </button>
              </div>
              <div className="mt-2">
                {tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-sm border border-line-strong bg-surface-2 px-2 py-0.5 text-[12px] text-ink-2">
                        {tag}
                        <button
                          type="button"
                          aria-label={template(text.removeTag, { tag })}
                          onClick={() => removeTag(tag)}
                          disabled={tagSaving}
                          className="ui-link ml-0.5 text-ink-3 no-underline hover:text-loss"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

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
                      className="ui-field h-8 min-w-0 flex-1 text-[12px]"
                    />
                    <button type="button" onClick={() => addTag(newTag)} disabled={!newTag.trim() || tagSaving} className="ui-button ui-button-primary h-8 px-2.5 text-[12px]">
                      {tagSaving ? "..." : dictionary.common.add}
                    </button>
                    <button type="button" aria-label={text.cancelAddTag} onClick={() => { setShowTagInput(false); setNewTag(""); }} className="ui-button h-8 px-2.5 text-[12px]">
                      ×
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowTagInput(true)} className="ui-link text-[12px] text-ink-2 no-underline hover:text-ink">
                    {text.addTag}
                  </button>
                )}

                {showTagManager && (
                  <div className="mt-2 flex flex-wrap gap-1 border-t border-line pt-2">
                    {PRESET_TAG_KEYS
                      .map((key) => text.presetTags[key])
                      .filter((preset) => !tags.includes(preset))
                      .map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => addTag(preset)}
                          disabled={tagSaving}
                          className="ui-button h-7 px-2 text-[12px]"
                        >
                          {preset}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-md border border-line-strong bg-surface p-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-ink-3">{text.notes}</span>
                {notes && !editingNotes && (
                  <button type="button" aria-label={text.editNotes} onClick={() => { setEditingNotes(true); setNotesDraft(notes); }} className="ui-link text-ink-3 no-underline hover:text-ink-2">
                    <IconPencil />
                  </button>
                )}
              </div>
              <div className="mt-2">
                {editingNotes ? (
                  notesEditor(4, text.notePlaceholder, dictionary.common.save)
                ) : notes ? (
                  <p className="cursor-pointer whitespace-pre-wrap text-[13px] leading-5 text-ink-2 hover:text-ink" onClick={() => { setEditingNotes(true); setNotesDraft(notes); }}>
                    {notes}
                  </p>
                ) : (
                  <button type="button" onClick={() => { setEditingNotes(true); setNotesDraft(""); }} className="ui-link text-[12px] text-ink-2 no-underline hover:text-ink">
                    {text.addNote}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "fills" && (
        <div id={panelId("fills")} role="tabpanel" aria-labelledby={tabId("fills")} className="overflow-x-auto p-5 text-[13px] text-ink-3">
          <p className="mb-3 text-[12px] leading-5">{template(dictionary.accounting.fillHint, { fee: formatMoney(-Math.abs(trade.fee)) })}</p>
          <table className="w-full min-w-[560px] text-[13px]">
            <caption className="sr-only">{text.fillsCaption}</caption>
            <thead>
              <tr className="border-b border-line text-[12px] text-ink-3">
                <th scope="col" className="py-2 text-left font-normal">{dictionary.common.type}</th>
                <th scope="col" className="py-2 text-right font-normal">{dictionary.common.price}</th>
                <th scope="col" className="py-2 text-right font-normal">{dictionary.common.qty}</th>
                <th scope="col" className="py-2 text-right font-normal">{dictionary.common.fee}</th>
                <th scope="col" className="py-2 text-right font-normal">{dictionary.common.time}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="py-2 text-profit">{text.open}</td>
                <td className="ui-num py-2 text-right text-ink">${trade.entryPrice.toFixed(4)}</td>
                <td className="ui-num py-2 text-right">--</td>
                <td className="ui-num py-2 text-right">--</td>
                <td className="ui-num py-2 text-right text-ink-2">{entryDateTime.full}</td>
              </tr>
              <tr>
                <td className="py-2 text-loss">{text.close}</td>
                <td className="ui-num py-2 text-right text-ink">${trade.exitPrice.toFixed(4)}</td>
                <td className="ui-num py-2 text-right">--</td>
                <td className="ui-num py-2 text-right">--</td>
                <td className="ui-num py-2 text-right text-ink-2">{exitDateTime.full}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "notes" && (
        <div id={panelId("notes")} role="tabpanel" aria-labelledby={tabId("notes")} className="p-5">
          <div className="min-h-[120px] rounded-md border border-line-strong bg-surface p-4">
            {editingNotes ? (
              notesEditor(5, text.noteLongPlaceholder, text.saveNotes)
            ) : notes ? (
              <p className="cursor-pointer whitespace-pre-wrap text-[13px] leading-6 text-ink-2 hover:text-ink" onClick={() => { setEditingNotes(true); setNotesDraft(notes); }}>
                {notes}
              </p>
            ) : (
              <button type="button" onClick={() => { setEditingNotes(true); setNotesDraft(""); }} className="ui-link text-[13px] text-ink-2 no-underline hover:text-ink">
                {text.addNotePlain}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
