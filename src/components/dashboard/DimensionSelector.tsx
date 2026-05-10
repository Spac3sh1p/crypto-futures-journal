"use client";

import { useRouter, useSearchParams } from "next/navigation";

const dimensions = [
  { id: "baseCoin", label: "By Coin" },
  { id: "side", label: "By Side" },
  { id: "leverage", label: "By Leverage" },
  { id: "holdDuration", label: "By Hold Duration" },
  { id: "dayOfWeek", label: "By Day" },
  { id: "hour", label: "By Hour" },
];

export function DimensionSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("dimension") || "baseCoin";

  function handleChange(dim: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("dimension", dim);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {dimensions.map((d) => (
        <button
          key={d.id}
          onClick={() => handleChange(d.id)}
          className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
            active === d.id
              ? "bg-yellow text-bg-primary font-semibold"
              : "bg-bg-secondary border border-border text-text-secondary hover:text-text-primary hover:border-text-muted"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
