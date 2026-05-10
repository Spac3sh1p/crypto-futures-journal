"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard/performance", label: "Performance", icon: "📈" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "📊" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 h-full bg-bg-secondary border-r border-border flex flex-col shrink-0">
      <div className="p-5 border-b border-border">
        <h1 className="text-base font-semibold text-text-primary tracking-tight">
          Crypto Futures
        </h1>
        <p className="text-xs text-text-muted mt-0.5">Trading Journal</p>
      </div>

      <nav className="flex-1 p-3">
        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-3 py-2">
          Dashboard
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-bg-hover text-yellow font-medium"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
