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
    <div className="bg-bg-secondary rounded-[10px] p-4 border border-border border-t-2 border-t-yellow">
      <div className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.15em] mb-2 font-display">
        {label}
      </div>
      <div className={`text-lg font-bold font-mono ${colorClass}`}>{value}</div>
      {subValue && (
        <div className="text-[11px] text-text-muted mt-1.5">{subValue}</div>
      )}
    </div>
  );
}
