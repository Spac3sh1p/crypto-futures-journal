import { describe, expect, it } from "vitest";
import { buildNiceScale } from "@/lib/dashboard/chart-ticks";

describe("buildNiceScale", () => {
  it("anchors at zero and rounds the domain to clean steps", () => {
    const scale = buildNiceScale([-66, 120, 643]);
    expect(scale.domain).toEqual([-200, 800]);
    expect(scale.ticks).toEqual([-200, 0, 200, 400, 600, 800]);
  });

  it("keeps all-positive series starting at zero", () => {
    const scale = buildNiceScale([12, 48, 97]);
    expect(scale.domain[0]).toBe(0);
    expect(scale.ticks[0]).toBe(0);
    expect(scale.ticks.at(-1)).toBeGreaterThanOrEqual(97);
  });

  it("handles a flat or empty series without NaN", () => {
    expect(buildNiceScale([])).toEqual({ domain: [0, 1], ticks: [0, 1] });
    const flat = buildNiceScale([5, 5]);
    expect(flat.ticks.every(Number.isFinite)).toBe(true);
    expect(flat.domain[0]).toBeLessThanOrEqual(5);
    expect(flat.domain[1]).toBeGreaterThanOrEqual(5);
  });
});
