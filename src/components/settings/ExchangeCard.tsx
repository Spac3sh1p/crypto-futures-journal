"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

interface Exchange {
  id: string;
  name: string;
  apiKey: string;
  label: string | null;
  isActive: boolean;
  lastSync: string | null;
  _count: { trades: number };
}

export function ExchangeCard({
  exchange,
  onDelete,
  onSync,
}: {
  exchange: Exchange;
  onDelete: (id: string) => void;
  onSync: (id: string) => void;
}) {
  const { dictionary, locale } = useI18n();
  const text = dictionary.settings;
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await onSync(exchange.id);
    setSyncing(false);
  };

  const handleDelete = async () => {
    if (!confirm(text.deleteConfirm)) return;
    setDeleting(true);
    await onDelete(exchange.id);
    setDeleting(false);
  };

  const displayName = exchange.label || exchange.name.charAt(0).toUpperCase() + exchange.name.slice(1);
  const lastSyncText = exchange.lastSync
    ? new Date(exchange.lastSync).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")
    : dictionary.common.never;

  return (
    <div className="trading-panel p-5">
      <div className="flex items-start justify-between">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          {/* Exchange icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg-tertiary">
            {exchange.name === "bybit" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M12 22V12M3 7l9 5 9-5" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            ) : exchange.name === "hyperliquid" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="#50E3C2" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M7 7h10v10" stroke="#50E3C2" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeWidth="1.5"/>
                <path d="M12 7v5l3.5 3.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary">{displayName}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-text-muted">{exchange.apiKey}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${exchange.isActive ? "bg-green" : "bg-red"}`} />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing || !exchange.isActive}
            className="flex items-center gap-1.5 rounded-lg bg-yellow px-3 py-1.5 text-xs font-semibold text-[#08111D] transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {syncing ? (
              <svg className="animate-spin w-3 h-3" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1.5 6a4.5 4.5 0 018.25-2.5M10.5 6a4.5 4.5 0 01-8.25 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M9 1v2.5h2.5M3 11V8.5H.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {syncing ? dictionary.common.syncing : dictionary.common.sync}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red/30 px-3 py-1.5 text-xs font-semibold text-red transition-all duration-200 hover:bg-red/10 disabled:opacity-40"
          >
            {deleting ? dictionary.common.deleting : dictionary.common.delete}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex items-center gap-4 border-t border-border-light pt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">{text.trades}</span>
          <span className="text-xs font-mono font-medium text-text-primary">{exchange._count.trades}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">{text.lastSync}</span>
          <span className="text-xs font-mono text-text-secondary">{lastSyncText}</span>
        </div>
      </div>
    </div>
  );
}
