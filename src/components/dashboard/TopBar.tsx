"use client";

import { useRouter, useSearchParams } from "next/navigation";

const ranges = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "all", label: "ALL" },
];

export function TopBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRange = searchParams.get("range") || "30d";

  function handleRangeChange(range: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-bg-secondary">
      <div className="flex items-center gap-1.5">
        {ranges.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRangeChange(r.id)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all duration-200 font-display ${
              activeRange === r.id
                ? "bg-gradient-to-r from-yellow to-[#FBBF24] text-bg-primary shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:border-yellow/30 border border-transparent"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
