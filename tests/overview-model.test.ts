import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ trades: vi.fn(), flows: vi.fn(), getWalletBalance: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { trade: { findMany: mocks.trades }, accountFlow: { findMany: mocks.flows } } }));
vi.mock("@/lib/exchange/balance", () => ({ getWalletBalance: mocks.getWalletBalance }));

import { loadOverviewModel } from "@/lib/dashboard/overview-model";
import { WalletBalance } from "@/components/overview/WalletBalance";

describe("overview balance streaming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.trades.mockResolvedValue([]);
    mocks.flows.mockResolvedValue([]);
  });

  it("builds the overview model without waiting for the exchange balance", async () => {
    const model = await loadOverviewModel("all");
    expect(mocks.getWalletBalance).not.toHaveBeenCalled();
    expect(model).not.toHaveProperty("balanceValue");
    expect(model.recentTrades).toEqual([]);
  });

  it("renders the formatted balance, or -- when no exchange answered", async () => {
    mocks.getWalletBalance.mockResolvedValueOnce({ asset: "USDT", total: 1234.5 });
    expect((await WalletBalance({ exchangeId: "ex1" })).props.children).toBe("$1,234.50");
    expect(mocks.getWalletBalance).toHaveBeenLastCalledWith("ex1");

    mocks.getWalletBalance.mockResolvedValueOnce({ asset: "USDT", total: null });
    expect((await WalletBalance({})).props.children).toBe("--");
  });
});
