"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ExchangeCard } from "@/components/settings/ExchangeCard";

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
        setMessage({ type: "success", text: "Exchange connected successfully!" });
        setFormData({ name: "bybit", apiKey: "", apiSecret: "", label: "" });
        setShowForm(false);
        await fetchExchanges();
      } else {
        setMessage({ type: "error", text: json.message || "Failed to add exchange" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
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
        setMessage({ type: "success", text: "Exchange deleted" });
      } else {
        setMessage({ type: "error", text: json.message || "Failed to delete" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  };

  const handleSync = async (id: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/exchanges/${id}/sync`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: `${json.data.message}` });
        await fetchExchanges();
      } else {
        setMessage({ type: "error", text: json.message || "Sync failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Sync network error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[10px] font-bold text-yellow uppercase tracking-[0.2em] font-display">
            Exchange Connections
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your exchange API keys and import trades
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-bg-primary bg-gradient-to-r from-yellow to-yellow/80 rounded-lg hover:brightness-110 transition-all duration-200 shadow-lg shadow-yellow/10"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Exchange
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
        <div className="bg-bg-secondary rounded-[14px] border border-border p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple to-yellow" />
          <h3 className="text-[10px] font-bold text-purple uppercase tracking-[0.2em] font-display mb-5">
            New Connection
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform select */}
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Platform</label>
              <select
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value as "bybit" | "binance" | "hyperliquid" }))}
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-yellow focus:outline-none transition-colors"
              >
                <option value="bybit">Bybit</option>
                <option value="binance">Binance</option>
                <option value="hyperliquid">Hyperliquid</option>
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="text-xs text-text-muted block mb-1.5">API Key</label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder="Enter your API key"
                required
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono placeholder:text-text-muted/50 focus:border-yellow focus:outline-none transition-colors"
              />
            </div>

            {/* API Secret */}
            <div>
              <label className="text-xs text-text-muted block mb-1.5">API Secret</label>
              <input
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData((f) => ({ ...f, apiSecret: e.target.value }))}
                placeholder="Enter your API secret"
                required
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono placeholder:text-text-muted/50 focus:border-yellow focus:outline-none transition-colors"
              />
            </div>

            {/* Label */}
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Label (optional)</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Main Account"
                className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:border-yellow focus:outline-none transition-colors"
              />
            </div>

            {/* Hint */}
            <p className="text-[11px] text-text-muted leading-relaxed">
              Only <span className="text-yellow font-medium">read-only</span> API permissions are required.
              Your keys are stored locally in SQLite and never sent to any third-party server.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-bg-primary bg-gradient-to-r from-yellow to-yellow/80 rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                    <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : null}
                {submitting ? "Connecting..." : "Connect Exchange"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm text-text-secondary border border-border rounded-lg hover:border-text-muted hover:text-text-primary transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exchange List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-bg-secondary rounded-[14px] border border-border p-5 animate-pulse">
              <div className="h-10 bg-bg-tertiary rounded-lg w-1/3" />
              <div className="h-4 bg-bg-tertiary rounded mt-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : exchanges.length === 0 ? (
        <div className="bg-bg-secondary rounded-[14px] border border-border border-dashed p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-tertiary border border-border flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-muted">
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 22V12M3 7l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-1">No exchanges connected</h3>
          <p className="text-xs text-text-muted mb-4">Add your exchange API key to start importing trades</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-bg-primary bg-gradient-to-r from-yellow to-yellow/80 rounded-lg hover:brightness-110 transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Your First Exchange
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
