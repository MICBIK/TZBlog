import fs from "node:fs";

import { expect, test } from "@playwright/test";

import {
  M4_PUBLIC_UI_SMOKE_DIR,
  M4_SMOKE_SCENES,
  m4ScreenshotPath,
  type M4SmokeViewport,
} from "./helpers/m4PublicUiSmoke";

const VIEWPORTS: Record<M4SmokeViewport, { width: number; height: number }> = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
};

test.describe("m4 public ui smoke", () => {
  test.beforeAll(() => {
    fs.mkdirSync(M4_PUBLIC_UI_SMOKE_DIR, { recursive: true });
  });

  for (const scene of M4_SMOKE_SCENES) {
    const viewports = scene.viewports ?? (["desktop", "mobile"] as const);

    for (const viewport of viewports) {
      test(`${scene.id} ${viewport} screenshot`, async ({ page }) => {
        if (scene.initScript) {
          await page.addInitScript(scene.initScript);
        }

        await page.setViewportSize(VIEWPORTS[viewport]);
        await page.goto(scene.path);

        await expect(page.locator(scene.readySelector).first()).toBeVisible({
          timeout: 15_000,
        });

        if (scene.id === "terminal-boot") {
          await expect(page.getByTestId("terminal-boot-skip")).toBeVisible();
        }

        const screenshotPath = m4ScreenshotPath(scene.id, viewport);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        expect(fs.existsSync(screenshotPath)).toBe(true);
      });
    }
  }
});
