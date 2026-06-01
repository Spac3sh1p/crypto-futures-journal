"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ExchangeCard } from "@/components/settings/ExchangeCard";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";

interface Exchange {
  id: string;
  name: string;
  apiKey: string;
  label: string | null;
  isActive: boolean;
  lastSync: string | null;
  _count: { trades: number };
}

export default function SettingsPage() {
  const { dictionary } = useI18n();
  const text = dictionary.settings;
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "bybit" as "bybit" | "binance" | "hyperliquid",
    apiKey: "",
    apiSecret: "",
    label: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const initialLoadDone = useRef(false);

  const fetchExchanges = useCallback(async () => {
    try {
      const res = await fetch("/api/exchanges");
      const json = await res.json();
      if (json.success) setExchanges(json.data);
    } catch {
      console.error("Failed to fetch exchanges");
    }
  }, []);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    fetchExchanges().finally(() => setLoading(false));
  }, [fetchExchanges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        setMessage({ type: "success", text: text.connected });
        setFormData({ name: "bybit", apiKey: "", apiSecret: "", label: "" });
        setShowForm(false);
        await fetchExchanges();
      } else {
        setMessage({ type: "error", text: text.addFailed });
      }
    } catch {
      setMessage({ type: "error", text: text.networkError });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/exchanges/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setExchanges((prev) => prev.filter((ex) => ex.id !== id));
        setMessage({ type: "success", text: text.deleted });
      } else {
        setMessage({ type: "error", text: text.deleteFailed });
      }
    } catch {
      setMessage({ type: "error", text: text.networkError });
    }
  };

  const handleSync = async (id: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/exchanges/${id}/sync`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: "success",
          text: template(text.syncSucceeded, {
            trades: json.data?.tradesAdded ?? 0,
            flows: json.data?.accountFlowsAdded ?? 0,
          }),
        });
        await fetchExchanges();
      } else {
        setMessage({ type: "error", text: text.syncFailed });
      }
    } catch {
      setMessage({ type: "error", text: text.syncNetworkError });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="terminal-section-title">
            {text.title}
          </h1>
          <p className="mt-1 text-sm font-medium text-text-muted">
            {text.subtitle}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-yellow px-4 py-2 text-sm font-semibold text-[#08111D] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {text.addExchange}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${
          message.type === "success"
            ? "bg-green/10 border-green/30 text-green"
            : "bg-red/10 border-red/30 text-red"
        }`}>
          {message.text}
        </div>
      )}

      {/* Add Exchange Form */}
      {showForm && (
        <div className="trading-panel p-6">
          <h3 className="mb-5 text-sm font-semibold text-text-primary">
            {text.newConnection}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform select */}
            <div>
              <label className="text-xs text-text-muted block mb-1.5">{text.platform}</label>
              <select
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value as "bybit" | "binance" | "hyperliquid" }))}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-yellow focus:outline-none"
              >
                <option value="bybit">Bybit</option>
                <option value="binance">Binance</option>
                <option value="hyperliquid">Hyperliquid</option>
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="text-xs text-text-muted block mb-1.5">{text.apiKey}</label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder={text.apiKeyPlaceholder}
                required
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 font-mono text-sm text-text-primary transition-colors placeholder:text-text-muted/50 focus:border-yellow focus:outline-none"
              />
            </div>

            {/* API Secret */}
            <div>
              <label className="text-xs text-text-muted block mb-1.5">{text.apiSecret}</label>
              <input
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData((f) => ({ ...f, apiSecret: e.target.value }))}
                placeholder={text.apiSecretPlaceholder}
                required
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 font-mono text-sm text-text-primary transition-colors placeholder:text-text-muted/50 focus:border-yellow focus:outline-none"
              />
            </div>

            {/* Label */}
            <div>
              <label className="text-xs text-text-muted block mb-1.5">{text.label}</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
                placeholder={text.labelPlaceholder}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary transition-colors placeholder:text-text-muted/50 focus:border-yellow focus:outline-none"
              />
            </div>

            {/* Hint */}
            <p className="text-[11px] text-text-muted leading-relaxed">
              {text.readOnlyHintPrefix} <span className="text-yellow font-medium">{text.readOnly}</span>
              {text.readOnlyHintSuffix}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-yellow px-5 py-2.5 text-sm font-semibold text-[#08111D] transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                    <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : null}
                {submitting ? text.connecting : text.connect}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-all duration-200 hover:border-text-muted hover:text-text-primary"
              >
                {dictionary.common.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exchange List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="trading-panel animate-pulse p-5">
              <div className="h-10 bg-bg-tertiary rounded-lg w-1/3" />
              <div className="h-4 bg-bg-tertiary rounded mt-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : exchanges.length === 0 ? (
        <div className="trading-panel border-dashed p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-tertiary border border-border flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-muted">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 22V12M3 7l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-1">{text.emptyTitle}</h3>
          <p className="text-xs text-text-muted mb-4">{text.emptySubtitle}</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow px-4 py-2 text-sm font-semibold text-[#08111D] transition-all duration-200 hover:brightness-110"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {text.addFirst}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {exchanges.map((ex) => (
            <ExchangeCard
              key={ex.id}
              exchange={ex}
              onDelete={handleDelete}
              onSync={handleSync}
            />
          ))}
        </div>
      )}
    </div>
  );
}
