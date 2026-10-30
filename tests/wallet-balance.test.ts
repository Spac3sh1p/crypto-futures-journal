import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), fetchBalance: vi.fn(), constructed: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { exchange: { findMany: mocks.findMany } } }));
vi.mock("@/lib/crypto", () => ({ decryptSecret: () => "secret" }));
vi.mock("ccxt", () => ({
  default: {
    binance: class {
      fetchBalance = mocks.fetchBalance;
      constructor(config: object) {
        mocks.constructed(config);
      }
    },
  },
}));

import { getWalletBalance, invalidateWalletBalanceCache, resetWalletBalanceState } from "@/lib/exchange/balance";

const exchange = { id: "ex1", name: "binance", apiKey: "key", apiSecret: "enc:secret" };

describe("wallet balance cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-30T12:00:00Z"));
    resetWalletBalanceState();
    vi.clearAllMocks();
    mocks.findMany.mockResolvedValue([exchange]);
    mocks.fetchBalance.mockResolvedValue({ total: { USDT: 123.45 } });
  });
  afterEach(() => vi.useRealTimers());

  it("reuses the ccxt client and the cached balance within 60 seconds", async () => {
    expect(await getWalletBalance()).toEqual({ asset: "USDT", total: 123.45 });
    vi.advanceTimersByTime(59_000);
    expect(await getWalletBalance("ex1")).toEqual({ asset: "USDT", total: 123.45 });
    expect(mocks.fetchBalance).toHaveBeenCalledTimes(1);
    expect(mocks.constructed).toHaveBeenCalledTimes(1);
  });

  it("refetches after the TTL and after an explicit invalidation without rebuilding the client", async () => {
    await getWalletBalance();
    vi.advanceTimersByTime(61_000);
    await getWalletBalance();
    expect(mocks.fetchBalance).toHaveBeenCalledTimes(2);
    invalidateWalletBalanceCache();
    await getWalletBalance();
    expect(mocks.fetchBalance).toHaveBeenCalledTimes(3);
    expect(mocks.constructed).toHaveBeenCalledTimes(1);
  });

  it("shares one in-flight request between concurrent renders", async () => {
    const [first, second] = await Promise.all([getWalletBalance(), getWalletBalance()]);
    expect(first.total).toBe(123.45);
    expect(second.total).toBe(123.45);
    expect(mocks.fetchBalance).toHaveBeenCalledTimes(1);
  });

  it("caches a failed lookup for only 15 seconds", async () => {
    mocks.fetchBalance.mockRejectedValue(new Error("network down"));
    expect((await getWalletBalance()).total).toBeNull();
    // binance 每次查询会依次尝试两种参数，所以一次失败的查询调用两次 fetchBalance
    expect(mocks.fetchBalance).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(14_000);
    expect((await getWalletBalance()).total).toBeNull();
    expect(mocks.fetchBalance).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(2_000);
    mocks.fetchBalance.mockResolvedValue({ total: { USDT: 5 } });
    expect((await getWalletBalance()).total).toBe(5);
    expect(mocks.fetchBalance).toHaveBeenCalledTimes(3);
  });
});
