"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ranges = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "all", label: "ALL" },
];

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRange = searchParams.get("range") || "30d";

  const pageMeta = pathname.includes("/analytics")
    ? {
        title: "Analytics",
        subtitle: "Trade behavior, timing, sizing, fees",
      }
    : pathname.includes("/settings")
      ? {
          title: "Settings",
          subtitle: "Exchange connections and sync controls",
        }
      : {
          title: "Performance",
          subtitle: "Realised PnL, equity curve, trade history",
        };

  function handleRangeChange(range: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`?${params.toString()}`);
  }

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-bg-secondary px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-text-primary">{pageMeta.title}</h2>
        <p className="mt-0.5 text-xs font-medium text-text-muted">{pageMeta.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-primary p-1">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRangeChange(r.id)}
              aria-pressed={activeRange === r.id}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60 ${
                activeRange === r.id
                  ? "bg-yellow text-bg-primary shadow-[0_0_12px_rgba(245,158,11,0.18)]"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Refresh dashboard data"
          onClick={handleRefresh}
          className="rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-yellow/40 hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
