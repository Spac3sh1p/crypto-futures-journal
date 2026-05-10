interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  valueColor?: "green" | "red" | "default";
}

export function MetricCard({
  label,
  value,
  subValue,
  valueColor = "default",
}: MetricCardProps) {
  const colorClass =
    valueColor === "green"
      ? "text-green"
      : valueColor === "red"
        ? "text-red"
        : "text-text-primary";

  return (
    <div className="bg-bg-secondary rounded-lg p-4 border border-border">
      <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
      {subValue && (
        <div className="text-[11px] text-text-muted mt-1.5">{subValue}</div>
      )}
    </div>
  );
}
