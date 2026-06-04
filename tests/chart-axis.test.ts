import { describe, expect, it } from "vitest";
import { getPositiveAnchoredDomain } from "@/lib/dashboard/chart-axis";

describe("getPositiveAnchoredDomain", () => {
  it("anchors the axis at zero when every finite value is non-negative", () => {
    expect(getPositiveAnchoredDomain([0, 120, 4500])).toEqual([0, "dataMax"]);
  });

  it("keeps the data minimum when the series actually contains negative values", () => {
    expect(getPositiveAnchoredDomain([100, -50, 240])).toEqual(["dataMin", "dataMax"]);
  });

  it("treats tiny negative noise as zero for positive-dominant curves", () => {
    expect(getPositiveAnchoredDomain([-5, 12033, 9000])).toEqual([0, "dataMax"]);
  });

  it("anchors empty or non-finite series at zero", () => {
    expect(getPositiveAnchoredDomain([Number.NaN, Number.POSITIVE_INFINITY])).toEqual([0, "dataMax"]);
  });
});
