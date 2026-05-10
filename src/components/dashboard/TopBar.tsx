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
      <div className="flex items-center gap-2">
        {ranges.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRangeChange(r.id)}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors ${
              activeRange === r.id
                ? "bg-yellow text-bg-primary"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
