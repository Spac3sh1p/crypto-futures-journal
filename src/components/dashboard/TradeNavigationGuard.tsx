"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

const NavigationContext = createContext<{ setBlocked: (value: boolean) => void; requestNavigation: () => boolean }>({ setBlocked: () => {}, requestNavigation: () => true });

export function TradeNavigationGuard({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { dictionary } = useI18n();
  const requestNavigation = useCallback(() => {
    if (blocked) setShowHint(true);
    return !blocked;
  }, [blocked]);
  return (
    <NavigationContext.Provider value={{ setBlocked, requestNavigation }}>
      {children}
      {blocked && showHint && <div role="alert" className="fixed bottom-6 right-6 z-50 max-w-md rounded-md border border-accent/40 bg-surface-2 p-4 text-[13px] text-accent">{dictionary.tradeFilters.unsaved}</div>}
    </NavigationContext.Provider>
  );
}

export const useTradeNavigation = () => useContext(NavigationContext);

export function TradeNavigationLink({ onNavigate, ...props }: ComponentProps<typeof Link>) {
  const { requestNavigation } = useTradeNavigation();
  return <Link {...props} onNavigate={(event) => {
    if (!requestNavigation()) event.preventDefault();
    else onNavigate?.(event);
  }} />;
}
