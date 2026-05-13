import { describe, it, expect } from "vitest";
import { safeTokenCompare } from "@/lib/auth";

describe("safeTokenCompare", () => {
  const token = "abc123def456";

  it("returns true for matching strings", () => {
    expect(safeTokenCompare(token, token)).toBe(true);
  });

  it("returns false for non-matching strings of same length", () => {
    expect(safeTokenCompare("abc123def457", token)).toBe(false);
  });

  it("returns false when lengths differ", () => {
    expect(safeTokenCompare("short", token)).toBe(false);
    expect(safeTokenCompare("this-is-a-much-longer-string-than-the-token", token)).toBe(false);
  });

  it("returns false for empty string vs non-empty", () => {
    expect(safeTokenCompare("", token)).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(safeTokenCompare("", "")).toBe(true);
  });

  it("returns false for null input (does not throw)", () => {
    expect(safeTokenCompare(null, token)).toBe(false);
  });

  it("returns false for undefined input (does not throw)", () => {
    expect(safeTokenCompare(undefined, token)).toBe(false);
  });

  it("returns false for numeric input (does not throw)", () => {
    expect(safeTokenCompare(12345, token)).toBe(false);
  });

  it("returns false for object input (does not throw)", () => {
    expect(safeTokenCompare({}, token)).toBe(false);
  });

  it("handles unicode strings correctly", () => {
    const unicode = "こんにちは世界";
    expect(safeTokenCompare(unicode, unicode)).toBe(true);
    expect(safeTokenCompare(unicode, "こんにちは世界!")).toBe(false);
  });
});
