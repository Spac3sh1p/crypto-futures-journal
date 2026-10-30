/** 两段式细条：盈利占比 / 亏损占比（2px 面色间隔），以及单段计量条。 */
export function SplitBar({ a, b, height = 6, label }: { a: number; b: number; height?: number; label?: string }) {
  const total = a + b;
  const aPct = total > 0 ? (a / total) * 100 : 0;
  const bPct = total > 0 ? (b / total) * 100 : 0;
  return (
    <div className="flex w-full gap-0.5" style={{ height }} role={label ? "img" : undefined} aria-label={label}>
      {aPct > 0 && <div className="rounded-full bg-profit" style={{ width: `${aPct}%` }} />}
      {bPct > 0 && <div className="rounded-full bg-loss" style={{ width: `${bPct}%` }} />}
      {total === 0 && <div className="w-full rounded-full bg-surface-3" />}
    </div>
  );
}

export function Meter({ value, tone = "profit", height = 6, label }: { value: number; tone?: "profit" | "loss" | "accent"; height?: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const fill = tone === "loss" ? "bg-loss" : tone === "accent" ? "bg-accent" : "bg-profit";
  return (
    <div className="w-full overflow-hidden rounded-full bg-surface-3" style={{ height }} role={label ? "img" : undefined} aria-label={label}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function SideChip({ side, long, short }: { side: string; long: string; short: string }) {
  const isLong = side === "Long";
  return (
    <span className={`inline-flex h-6 items-center rounded-sm px-1.5 text-[12px] font-medium ${isLong ? "bg-profit/12 text-profit" : "bg-loss/12 text-loss"}`}>
      {isLong ? long : short}
    </span>
  );
}
