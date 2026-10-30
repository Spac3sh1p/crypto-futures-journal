import { describe, expect, it } from "vitest";
import { formatDurationBucketLabel } from "@/lib/dashboard/analytics-labels";

describe("formatDurationBucketLabel", () => {
  it("drops zero units and translates for Chinese", () => {
    expect(formatDurationBucketLabel("> 0s 0d 0h 1m", "zh")).toBe("> 1分");
    expect(formatDurationBucketLabel("> 0d 1h 55m", "zh")).toBe("> 1小时 55分");
  });

  it("keeps English units", () => {
    expect(formatDurationBucketLabel("> 0d 7h 37m", "en")).toBe("> 7h 37m");
  });
});
