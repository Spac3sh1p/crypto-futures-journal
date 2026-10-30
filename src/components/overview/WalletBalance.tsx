import { getWalletBalance } from "@/lib/exchange/balance";
import { formatBalance } from "@/lib/dashboard/overview-model";

/** 余额卡的数字。独立的服务端组件，放在 Suspense 里流式加载：总览其余部分不等交易所往返。 */
export async function WalletBalance({ exchangeId }: { exchangeId?: string }) {
  const balance = await getWalletBalance(exchangeId);
  return <>{balance.total === null ? "--" : formatBalance(balance.total)}</>;
}

/** 余额未到时的占位：与数字同高的静音色块，不写文字。 */
export function WalletBalanceFallback() {
  return <span className="inline-block h-[15px] w-16 animate-pulse rounded bg-surface-3 align-middle" aria-hidden="true" />;
}
