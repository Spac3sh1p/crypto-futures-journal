import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTrade } from "./helpers";
const mock = vi.hoisted(() => ({ trades: vi.fn(), flows: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { trade: { findMany: mock.trades }, accountFlow: { findMany: mock.flows } } }));
import { getTradesInRange, getTradesForMonth, getRangeStartDate } from "@/lib/dashboard/queries";

describe("accounting before date filters", () => {
  beforeEach(() => vi.clearAllMocks());
  it("uses the same competing positions for all-history, period, and month views", async () => {
    const start = getRangeStartDate("7d")!;
    const firstExit = new Date(start.getTime() - 1000);
    const secondExit = new Date(start.getTime() + 3600000);
    const make = (entryTime: Date, exitTime: Date, realizedPnl: number) => ({ ...makeTrade({ exchangeId: "ex", externalId: `binance_position_${realizedPnl}`, symbol: "BTCUSDT", entryTime, exitTime, realizedPnl, fee: 0 }), exchange: { name: "binance" } });
    const first = make(new Date(start.getTime() - 3600000), firstExit, 100);
    const second = make(start, secondExit, 20);
    mock.trades.mockResolvedValue([second, first]);
    mock.flows.mockResolvedValue([first, second].map(t => ({ exchangeId: "ex", symbol: "BTCUSDT", type: "REALIZED_PNL", asset: "USDT", amount: t.realizedPnl, time: t.exitTime })));
    const all = await getTradesInRange("all", "ex");
    const recent = await getTradesInRange("7d", "ex");
    const month = await getTradesForMonth(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, "ex");
    expect(recent).toHaveLength(1);
    expect(recent[0]).toMatchObject({ realizedPnl: 20, accountingStatus: "needs-review" });
    expect(all.find(t => t.id === second.id)).toEqual(recent[0]);
    expect(month.find(t => t.id === second.id)).toEqual(recent[0]);
    expect(mock.trades.mock.calls.every(([args]) => args.where.exitTime === undefined)).toBe(true);
  });
  it("includes today in the displayed seven calendar days", () => {
    const now = new Date(2026, 8, 5, 12);
    expect(getRangeStartDate("7d", now)).toEqual(new Date(2026, 7, 30));
    expect(getRangeStartDate("30d", now)).toEqual(new Date(2026, 7, 7));
  });
});
