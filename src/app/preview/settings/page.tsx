"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ExchangeRowV2, type ExchangeRecord } from "@/components/v2/settings/ExchangeRowV2";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { template } from "@/lib/i18n";
import { Panel } from "@/components/v2/ui/Panel";

type ExchangeName = "bybit" | "binance" | "hyperliquid";

export default function PreviewSettingsPage() {
  const { dictionary } = useI18n();
  const text = dictionary.settings;
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "bybit" as ExchangeName, apiKey: "", apiSecret: "", label: "" });
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/exchanges/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setExchanges((prev) => prev.filter((exchange) => exchange.id !== id));
        setMessage({ type: "success", text: text.deleted });
      } else {
        setMessage({ type: "error", text: text.deleteFailed });
      }
    } catch {
      setMessage({ type: "error", text: text.networkError });
    }
  }

  async function handleSync(id: string) {
    setMessage(null);
    try {
      const res = await fetch(`/api/exchanges/${id}/sync`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setMessage({
          type: "success",
          text: template(text.syncSucceeded, { trades: json.data?.tradesAdded ?? 0, flows: json.data?.accountFlowsAdded ?? 0 }),
        });
        await fetchExchanges();
      } else {
        setMessage({ type: "error", text: json.data?.message ?? json.message ?? text.syncFailed });
        if (json.data?.status === "partial") await fetchExchanges();
      }
    } catch {
      setMessage({ type: "error", text: text.syncNetworkError });
    }
  }

  const fieldClass = "v2-field h-9 w-full";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{text.title}</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">{text.subtitle}</p>
        </div>
        <button type="button" onClick={() => setShowForm((open) => !open)} className="v2-button v2-button-primary">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          {text.addExchange}
        </button>
      </div>

      {message && (
        <div role="status" className={`rounded-md border px-4 py-3 text-[13px] ${message.type === "success" ? "border-profit/30 bg-profit/10 text-profit" : "border-loss/30 bg-loss/10 text-loss"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <Panel>
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <h3 className="text-[14px] font-medium text-ink">{text.newConnection}</h3>
            <div className="grid gap-1.5">
              <label htmlFor="preview-exchange-platform" className="text-[12px] text-ink-3">{text.platform}</label>
              <select id="preview-exchange-platform" value={formData.name} onChange={(event) => setFormData((form) => ({ ...form, name: event.target.value as ExchangeName }))} className={fieldClass}>
                <option value="bybit">Bybit</option>
                <option value="binance">Binance</option>
                <option value="hyperliquid">Hyperliquid</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="preview-exchange-apiKey" className="text-[12px] text-ink-3">{text.apiKey}</label>
              <input id="preview-exchange-apiKey" type="text" value={formData.apiKey} onChange={(event) => setFormData((form) => ({ ...form, apiKey: event.target.value }))} placeholder={text.apiKeyPlaceholder} required className={`${fieldClass} v2-num`} />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="preview-exchange-apiSecret" className="text-[12px] text-ink-3">{text.apiSecret}</label>
              <input id="preview-exchange-apiSecret" type="password" value={formData.apiSecret} onChange={(event) => setFormData((form) => ({ ...form, apiSecret: event.target.value }))} placeholder={text.apiSecretPlaceholder} required className={`${fieldClass} v2-num`} />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="preview-exchange-label" className="text-[12px] text-ink-3">{text.label}</label>
              <input id="preview-exchange-label" type="text" value={formData.label} onChange={(event) => setFormData((form) => ({ ...form, label: event.target.value }))} placeholder={text.labelPlaceholder} className={fieldClass} />
            </div>
            <p className="text-[12px] leading-5 text-ink-3">
              {text.readOnlyHintPrefix} <span className="text-ink-2">{text.readOnly}</span>{text.readOnlyHintSuffix}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button type="submit" disabled={submitting} className="v2-button v2-button-primary">
                {submitting ? text.connecting : text.connect}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="v2-button">{dictionary.common.cancel}</button>
            </div>
          </form>
        </Panel>
      )}

      {loading ? (
        <Panel className="px-5 py-8 text-center text-[13px] text-ink-3">{dictionary.common.loading}</Panel>
      ) : exchanges.length === 0 ? (
        <Panel className="px-5 py-12 text-center">
          <h3 className="text-[14px] font-medium text-ink">{text.emptyTitle}</h3>
          <p className="mt-1 text-[13px] text-ink-3">{text.emptySubtitle}</p>
          <button type="button" onClick={() => setShowForm(true)} className="v2-button v2-button-primary mt-4">
            {text.addFirst}
          </button>
        </Panel>
      ) : (
        <div className="space-y-3">
          {exchanges.map((exchange) => (
            <ExchangeRowV2 key={exchange.id} exchange={exchange} onDelete={handleDelete} onSync={handleSync} />
          ))}
        </div>
      )}
    </div>
  );
}
