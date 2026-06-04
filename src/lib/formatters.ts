import type { Locale } from "@/lib/i18n";

export function formatDuration(seconds: number, locale: Locale = "en"): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (locale === "zh") {
    if (h > 0) return `${h}小时 ${m}分 ${s}秒`;
    if (m > 0) return `${m}分 ${s}秒`;
    return `${s}秒`;
  }
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatMoney(val: number): string {
  const prefix = val >= 0 ? "+$" : "-$";
  return `${prefix}${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatSignedPositionNotional(notional: number, side: string): string {
  const signedValue = side === "Short" ? -Math.abs(notional) : Math.abs(notional);
  return formatMoney(signedValue);
}

export function formatTradePrice(price: number): string {
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export interface DateTimeParts {
  date: string;
  time: string;
  full: string;
}

export function formatTradeDateTimeParts(input: string | Date, locale: Locale = "en"): DateTimeParts {
  const d = typeof input === "string" ? new Date(input) : input;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  const mon = d.toLocaleString("en", { month: "short" });
  const yr = String(d.getFullYear()).slice(2);
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = locale === "zh" ? `${year}/${month}/${day}` : `${day}/${mon}/${yr}`;
  return {
    date,
    time,
    full: `${date} - ${time}`,
  };
}

const VALID_RANGES = ["7d", "30d", "90d", "all"] as const;
export type TradeRange = (typeof VALID_RANGES)[number];

export function parseRange(raw: string | undefined): TradeRange {
  if (raw && VALID_RANGES.includes(raw as TradeRange)) {
    return raw as TradeRange;
  }
  return "30d";
}

export function sanitizeCsvField(value: string): string {
  if (/^[\t\r\n]/.test(value) || /^\s*[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}
