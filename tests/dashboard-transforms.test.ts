import { describe, expect, it } from "vitest";
import { buildCumulativePnlSeries } from "@/lib/dashboard/transforms";
import { makeTrade } from "./helpers";

describe("buildCumulativePnlSeries", () => {
  it("aggregates same-day trades before calculating the cumulative equity curve", () => {
    const trades = [
      makeTrade({
        realizedPnl: 30,
        exitTime: new Date("2024-01-16T10:00:00Z"),
      }),
      makeTrade({
        realizedPnl: 100,
        exitTime: new Date("2024-01-15T11:00:00Z"),
      }),
      makeTrade({
        realizedPnl: -40,
        exitTime: new Date("2024-01-15T14:00:00Z"),
      }),
    ];

    expect(buildCumulativePnlSeries(trades)).toEqual([
      { date: "2024-01-15", value: 60 },
      { date: "2024-01-16", value: 90 },
    ]);
  });
});
