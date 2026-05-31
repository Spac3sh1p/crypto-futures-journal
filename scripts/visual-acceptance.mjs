import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const targetUrl = process.argv[2] || process.env.VISUAL_URL || "http://localhost:3000/dashboard/performance";
const outputDir = path.resolve("output/playwright/visual-acceptance");

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "narrow", width: 900, height: 1000 },
  { name: "mobile", width: 390, height: 900 },
];

function pass(name, details = "") {
  return { ok: true, name, details };
}

function fail(name, details) {
  return { ok: false, name, details };
}

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForSelector("text=Trade History", { timeout: 20_000 });

    const expandButtons = page.locator('button[aria-label^="Expand"]');
    const expandCount = await expandButtons.count();
    if (expandCount === 0) {
      results.push(fail(`${viewport.name}: expandable trade row`, "No expandable trade rows found."));
    } else {
      await expandButtons.first().scrollIntoViewIfNeeded();
      await expandButtons.first().click();
      await page.locator('button[aria-label^="Collapse"]').first().waitFor({ state: "visible", timeout: 5_000 });
      const detailHeading = page.getByText("Chart Summary").first();
      await detailHeading.waitFor({ state: "attached", timeout: 5_000 });
      await detailHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1_500);
      results.push(pass(`${viewport.name}: expandable trade row`, `${expandCount} row controls found; detail panel opened.`));
    }

    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const chart = document.querySelector('svg[role="img"][aria-label*="candlestick"]');
      const chartBox = chart?.getBoundingClientRect();
      const loadingOrEmpty = document.querySelector('[role="status"]');
      const table = document.querySelector("table");
      const tableBox = table?.getBoundingClientRect();

      return {
        documentOverflowX: root.scrollWidth - root.clientWidth,
        hasChart: Boolean(chart),
        hasStatus: Boolean(loadingOrEmpty),
        chartWidth: chartBox?.width ?? 0,
        chartHeight: chartBox?.height ?? 0,
        tableWidth: tableBox?.width ?? 0,
      };
    });

    if (metrics.documentOverflowX <= 2) {
      results.push(pass(`${viewport.name}: page horizontal overflow`, `${metrics.documentOverflowX}px`));
    } else {
      results.push(fail(`${viewport.name}: page horizontal overflow`, `${metrics.documentOverflowX}px`));
    }

    if (metrics.hasChart && metrics.chartWidth >= 300 && metrics.chartHeight >= 200) {
      results.push(pass(`${viewport.name}: mini kline rendered`, `${Math.round(metrics.chartWidth)}x${Math.round(metrics.chartHeight)}`));
    } else if (metrics.hasStatus) {
      results.push(pass(`${viewport.name}: mini kline fallback`, "Explicit loading/empty state is visible."));
    } else {
      results.push(fail(`${viewport.name}: mini kline rendered`, "No chart or explicit fallback state found after expanding a trade."));
    }

    const screenshotPath = path.join(outputDir, `performance-${viewport.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.push(pass(`${viewport.name}: screenshot`, screenshotPath));
    await page.close();
  }
} finally {
  await browser.close();
}

const summary = {
  targetUrl,
  outputDir,
  checkedAt: new Date().toISOString(),
  results,
};

await writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

const failures = results.filter((result) => !result.ok);
for (const result of results) {
  const prefix = result.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${result.name}${result.details ? ` - ${result.details}` : ""}`);
}

if (failures.length > 0) {
  process.exitCode = 1;
}
