import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  getDictionary,
  isLocale,
  normalizeLocale,
} from "@/lib/i18n";

describe("i18n", () => {
  it("defaults to Chinese for public-facing pages", () => {
    expect(DEFAULT_LOCALE).toBe("zh");
    expect(normalizeLocale(undefined)).toBe("zh");
    expect(normalizeLocale("fr")).toBe("zh");
  });

  it("keeps English and Chinese dictionary sections aligned", () => {
    const zh = getDictionary("zh");
    const en = getDictionary("en");

    expect(zh.topBar.refresh).toBe("刷新");
    expect(en.topBar.refresh).toBe("Refresh");
    expect(Object.keys(zh)).toEqual(Object.keys(en));
    expect(Object.keys(zh.performance.metrics)).toEqual(Object.keys(en.performance.metrics));
    expect(Object.keys(zh.overview.periodReview)).toEqual(Object.keys(en.overview.periodReview));
    expect(Object.keys(zh.overview.symbolTop10)).toEqual(Object.keys(en.overview.symbolTop10));
    expect(Object.keys(zh.analytics.symbols)).toEqual(Object.keys(en.analytics.symbols));
    expect(Object.keys(zh.tradeHistory.columns)).toEqual(Object.keys(en.tradeHistory.columns));
  });

  it("validates supported locale values only", () => {
    expect(isLocale("zh")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("cn")).toBe(false);
  });
});
