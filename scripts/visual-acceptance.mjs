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

async function waitForAnyText(page, texts, timeout = 45_000) {
  const deadline = Date.now() + timeout;
  const fallbackTexts = [
    "Total PnL",
    "Recent Trades",
    "\u603b\u76c8\u4e8f",
    "\u6700\u8fd1\u4ea4\u6613",
    "\u4ea4\u6613\u8bb0\u5f55",
  ];
  for (;;) {
    for (const text of texts) {
      const locator = page.getByText(text).first();
      if (await locator.isVisible().catch(() => false)) return;
    }
    const bodyText = await page.locator("body").innerText({ timeout: 1_000 }).catch(() => "");
    if ([...texts, ...fallbackTexts].some((text) => bodyText.includes(text))) return;
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for any text: ${texts.join(", ")}`);
    }
    await page.waitForTimeout(250);
  }
}

function rowToggleLocator(page, state) {
  const expandedState = state === "expand" ? "false" : "true";
  return page.locator(`button[aria-expanded="${expandedState}"]`);
}

  /* if (state === "expand") {
    return page.locator(
      'button[aria-label^="Expand"], button[aria-label^="展开"], button:has-text("Details"), button:has-text("查看详情")'
    );
  }
  return page.locator(
    'button[aria-label^="Collapse"], button[aria-label^="收起"], button:has-text("Collapse"), button:has-text("收起详情")'
  );
}
*/

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await waitForAnyText(page, ["Trade History", "交易记录", "Recent Trades", "最近交易", "账户表现总览"]);

    const expandButtons = rowToggleLocator(page, "expand");
    const expandCount = await expandButtons.count();
    if (expandCount === 0) {
      results.push(fail(`${viewport.name}: expandable trade row`, "No expandable trade rows found."));
    } else {
      await expandButtons.first().scrollIntoViewIfNeeded();
      await expandButtons.first().click();
      await rowToggleLocator(page, "collapse").first().waitFor({ state: "visible", timeout: 5_000 });
      await waitForAnyText(page, ["Chart Summary", "K线复盘"], 5_000);
      await page.getByText("K线复盘").or(page.getByText("Chart Summary")).first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(1_500);
      results.push(pass(`${viewport.name}: expandable trade row`, `${expandCount} row controls found; detail panel opened.`));
    }

    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const chart = document.querySelector(
        'svg[role="img"][aria-label*="candlestick"], svg[role="img"][aria-label*="K"]'
      );
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
