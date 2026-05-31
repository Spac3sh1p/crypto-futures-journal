import { InfoHint } from "@/components/ui/InfoHint";

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  valueColor?: "green" | "red" | "default";
  description?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  valueColor = "default",
  description,
}: MetricCardProps) {
  const colorClass =
    valueColor === "green"
      ? "text-green"
      : valueColor === "red"
        ? "text-red"
        : "text-text-primary";

  return (
    <div className="min-w-0 rounded-[10px] border border-border border-t-2 border-t-yellow bg-bg-secondary p-4">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
        <span>{label}</span>
        {description && <InfoHint label={description} />}
      </div>
      <div className={`truncate font-mono text-lg font-bold tabular-nums ${colorClass}`}>{value}</div>
      {subValue && (
        <div className="mt-1.5 truncate text-[11px] font-medium text-text-muted">{subValue}</div>
      )}
    </div>
  );
}
