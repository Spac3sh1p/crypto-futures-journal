import { describe, it, expect } from "vitest";
import { parseRange, formatDuration, sanitizeCsvField } from "@/lib/formatters";

describe("parseRange", () => {
  it("returns valid range values unchanged", () => {
    expect(parseRange("7d")).toBe("7d");
    expect(parseRange("30d")).toBe("30d");
    expect(parseRange("90d")).toBe("90d");
    expect(parseRange("all")).toBe("all");
  });

  it("returns '30d' for undefined", () => {
    expect(parseRange(undefined)).toBe("30d");
  });

  it("returns '30d' for invalid strings", () => {
    expect(parseRange("999d")).toBe("30d");
    expect(parseRange("")).toBe("30d");
    expect(parseRange("foo")).toBe("30d");
    expect(parseRange("ALL")).toBe("30d");
  });
});

describe("formatDuration", () => {
  it("formats 0 seconds", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats seconds only", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(125)).toBe("2m 5s");
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatDuration(3661)).toBe("1h 1m 1s");
  });

  it("formats exact hours", () => {
    expect(formatDuration(7200)).toBe("2h 0m 0s");
  });
});

describe("sanitizeCsvField", () => {
  it("returns safe strings unchanged", () => {
    expect(sanitizeCsvField("hello")).toBe("hello");
    expect(sanitizeCsvField("BTCUSDT")).toBe("BTCUSDT");
    expect(sanitizeCsvField("123.45")).toBe("123.45");
  });

  it("prepends quote for = prefix", () => {
    expect(sanitizeCsvField("=CMD()")).toBe("'=CMD()");
  });

  it("prepends quote for + prefix", () => {
    expect(sanitizeCsvField("+100")).toBe("'+100");
  });

  it("prepends quote for - prefix", () => {
    expect(sanitizeCsvField("-50.5")).toBe("'-50.5");
  });

  it("prepends quote for @ prefix", () => {
    expect(sanitizeCsvField("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("prepends quote for tab prefix", () => {
    expect(sanitizeCsvField("\tdata")).toBe("'\tdata");
  });

  it("prepends quote for carriage return prefix", () => {
    expect(sanitizeCsvField("\rdata")).toBe("'\rdata");
  });
});
