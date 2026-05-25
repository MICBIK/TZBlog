import { test, expect } from "@playwright/test";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const PERFORMANCE_THRESHOLD = 85;

test("lighthouseMobilePerfAtLeast85", async () => {
  test.setTimeout(180_000);

  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });

  try {
    const result = await lighthouse(baseURL, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance"],
      formFactor: "mobile",
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        disabled: false,
      },
    });

    const score = (result?.lhr.categories.performance?.score ?? 0) * 100;
    expect(score).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLD);
  } finally {
    await chrome.kill();
  }
});
