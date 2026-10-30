import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-md border border-line-strong bg-surface ${className}`}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  subtitle,
  actions,
  divided = true,
  size = "md",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  divided?: boolean;
  /** sm：分析页等信息密度高的卡片用的紧凑表头 */
  size?: "md" | "sm";
}) {
  const compact = size === "sm";
  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 ${compact ? "px-4 py-2.5" : "px-5 py-3.5"} ${divided ? "border-b border-line" : ""}`}>
      <div className="min-w-0">
        <h2 className={`font-semibold text-ink ${compact ? "text-[14px] leading-5" : "text-[15px] leading-6"}`}>{title}</h2>
        {subtitle && <p className={`text-ink-3 ${compact ? "text-[12px] leading-4" : "mt-0.5 text-[13px] leading-5"}`}>{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-5 py-12 text-center text-[13px] text-ink-3">{children}</div>;
}
