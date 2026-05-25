import fs from "node:fs";

import { expect, test } from "@playwright/test";

import {
  CHANNEL_LAYOUT_MATRIX,
  CHANNEL_LAYOUT_SMOKE_DIR,
  CHANNEL_THEME_NAMES,
  screenshotPath,
} from "./helpers/channelLayoutSmoke";

test.describe("channel layout theme smoke", () => {
  test.beforeAll(() => {
    fs.mkdirSync(CHANNEL_LAYOUT_SMOKE_DIR, { recursive: true });
  });

  for (const { layout, slug } of CHANNEL_LAYOUT_MATRIX) {
    for (const theme of CHANNEL_THEME_NAMES) {
      test(`${layout} layout renders under ${theme} theme`, async ({ page }) => {
        await page.goto(`/c/${slug}`);
        await expect(page.locator("[data-channel-layout]")).toBeVisible();

        await page.evaluate((nextTheme) => {
          document.documentElement.setAttribute("data-theme", nextTheme);

          for (const node of document.querySelectorAll<HTMLElement>("[data-theme]")) {
            if (node !== document.documentElement) {
              node.setAttribute("data-theme", nextTheme);
            }
          }
        }, theme);

        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

        const desktopPath = screenshotPath(layout, theme, "desktop");
        await page.screenshot({ path: desktopPath, fullPage: true });

        await page.setViewportSize({ width: 390, height: 844 });
        const mobilePath = screenshotPath(layout, theme, "mobile");
        await page.screenshot({ path: mobilePath, fullPage: true });

        expect(fs.existsSync(desktopPath)).toBe(true);
        expect(fs.existsSync(mobilePath)).toBe(true);
      });
    }
  }
});
