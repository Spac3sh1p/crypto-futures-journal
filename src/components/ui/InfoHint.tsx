interface InfoHintProps {
  label: string;
}

export function InfoHint({ label }: InfoHintProps) {
  return (
    <span
      tabIndex={0}
      title={label}
      aria-label={label}
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-bg-tertiary align-middle font-mono text-[10px] font-bold text-text-muted transition-colors hover:border-yellow/40 hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow/60"
    >
      i
    </span>
  );
}
