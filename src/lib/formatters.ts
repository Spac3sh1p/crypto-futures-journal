export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatMoney(val: number): string {
  const prefix = val >= 0 ? "+$" : "-$";
  return `${prefix}${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}
