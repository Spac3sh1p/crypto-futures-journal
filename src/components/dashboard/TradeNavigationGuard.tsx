"use client";

import Link, { useLinkStatus } from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";

interface NavigationContextValue {
  setBlocked: (value: boolean) => void;
  requestNavigation: () => boolean;
  /** 有页面跳转、区间切换或刷新正在等服务端返回；顶栏据此显示进度条 */
  pending: boolean;
  setPending: (key: string, value: boolean) => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  setBlocked: () => {},
  requestNavigation: () => true,
  pending: false,
  setPending: () => {},
});

export function TradeNavigationGuard({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const { dictionary } = useI18n();
  const requestNavigation = useCallback(() => {
    if (blocked) setShowHint(true);
    return !blocked;
  }, [blocked]);
  const setPending = useCallback((key: string, value: boolean) => {
    setPendingKeys((keys) => {
      const has = keys.includes(key);
      if (has === value) return keys;
      return value ? [...keys, key] : keys.filter((item) => item !== key);
    });
  }, []);
  const value = useMemo<NavigationContextValue>(
    () => ({ setBlocked, requestNavigation, pending: pendingKeys.length > 0, setPending }),
    [requestNavigation, pendingKeys.length, setPending],
  );
  return (
    <NavigationContext.Provider value={value}>
      {children}
      {blocked && showHint && <div role="alert" className="fixed bottom-6 right-6 z-50 max-w-md rounded-md border border-accent/40 bg-surface-2 p-4 text-[13px] text-accent">{dictionary.tradeFilters.unsaved}</div>}
    </NavigationContext.Provider>
  );
}

export const useTradeNavigation = () => useContext(NavigationContext);

/** 把 useTransition / useLinkStatus 的等待状态汇总到导航上下文，顶栏只画一条进度条 */
export function usePendingNavigation(pending: boolean) {
  const id = useId();
  const { setPending } = useTradeNavigation();
  useEffect(() => {
    setPending(id, pending);
    return () => setPending(id, false);
  }, [id, pending, setPending]);
}

function LinkPendingReporter() {
  const { pending } = useLinkStatus();
  usePendingNavigation(pending);
  return null;
}

export function TradeNavigationLink({ onNavigate, children, ...props }: ComponentProps<typeof Link>) {
  const { requestNavigation } = useTradeNavigation();
  return (
    <Link
      {...props}
      onNavigate={(event) => {
        if (!requestNavigation()) event.preventDefault();
        else onNavigate?.(event);
      }}
    >
      {children}
      <LinkPendingReporter />
    </Link>
  );
}
