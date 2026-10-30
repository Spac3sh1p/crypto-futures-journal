"use server";

import { isAuthenticated } from "@/lib/auth";
import { invalidateWalletBalanceCache } from "@/lib/exchange/balance";

/** 顶栏「刷新」先调用它清掉余额缓存，再 router.refresh()，让总览重新向交易所取余额。 */
export async function refreshWalletBalance(): Promise<void> {
  if (!(await isAuthenticated())) return;
  invalidateWalletBalanceCache();
}
