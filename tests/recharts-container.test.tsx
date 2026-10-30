import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OverviewCurveChart } from "@/components/overview/OverviewCurveChart";

vi.mock("@/components/i18n/LanguageProvider", () => ({
  useI18n: () => ({
    dictionary: {
      overview: {
        mainCurve: "Cumulative PnL",
      },
      performance: {
        cumulative: {
          empty: "No data",
        },
      },
    },
  }),
}));

describe("Recharts containers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not emit the Recharts -1 size warning during OverviewCurveChart SSR", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderToString(
      <OverviewCurveChart
        data={[
          { date: "2026-06-01", value: 12.5 },
          { date: "2026-06-02", value: 24.75 },
        ]}
      />
    );

    expect(
      warn.mock.calls.some(([message]) =>
        String(message).includes("The width(-1) and height(-1) of chart should be greater than 0")
      )
    ).toBe(false);
  });
});
