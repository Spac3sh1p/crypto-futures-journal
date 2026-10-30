"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Panel } from "@/components/ui/Panel";

export interface ExchangeRecord {
  id: string;
  name: string;
  apiKey: string;
  label: string | null;
  isActive: boolean;
  lastSync: string | null;
  _count: { trades: number };
}

function exchangeMark(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized === "bybit") return "Y";
  if (normalized === "hyperliquid") return "H";
  return "B";
}

function displayName(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized === "bybit") return "Bybit";
  if (normalized === "binance") return "Binance";
  if (normalized === "hyperliquid") return "Hyperliquid";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function ExchangeRow({ exchange, onDelete, onSync }: {
  exchange: ExchangeRecord;
  onDelete: (id: string) => Promise<void> | void;
  onSync: (id: string) => Promise<void> | void;
}) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.settings;
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSync() {
    setSyncing(true);
    await onSync(exchange.id);
    setSyncing(false);
  }

  async function handleDelete() {
    if (!confirm(text.deleteConfirm)) return;
    setDeleting(true);
    await onDelete(exchange.id);
    setDeleting(false);
  }

  const lastSyncText = exchange.lastSync
    ? new Date(exchange.lastSync).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")
    : dictionary.common.never;

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 text-[14px] font-semibold text-ink-2">
          {exchangeMark(exchange.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-ink">{displayName(exchange.name)}</span>
            {exchange.label && <span className="text-[13px] text-ink-2">{exchange.label}</span>}
            <span className={`h-1.5 w-1.5 rounded-full ${exchange.isActive ? "bg-profit" : "bg-loss"}`} aria-hidden="true" />
          </div>
          <div className="ui-num mt-0.5 flex flex-wrap gap-x-4 text-[12px] text-ink-3">
            <span>{exchange.apiKey}</span>
            <span>{text.trades} <span className="text-ink-2">{exchange._count.trades}</span></span>
            <span>{text.lastSync} <span className="text-ink-2">{lastSyncText}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleSync} disabled={syncing || !exchange.isActive} className="ui-button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={syncing ? "animate-spin" : ""}>
              <path d="M20 12a8 8 0 01-13.66 5.66M4 12A8 8 0 0117.66 6.34M18 3v4h-4M6 21v-4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {syncing ? dictionary.common.syncing : dictionary.common.sync}
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="ui-button text-loss hover:text-loss">
            {deleting ? dictionary.common.deleting : dictionary.common.delete}
          </button>
        </div>
      </div>
    </Panel>
  );
}
