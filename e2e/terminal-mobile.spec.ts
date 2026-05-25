import { expect, test } from "@playwright/test";

test.describe("terminal stream mobile", () => {
  test("mobile375HidesLineNumbers", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/c/stream/note-2026-05-23");

    await expect(page.getByTestId("terminal-entry-detail")).toBeVisible();
    await expect(page.getByTestId("terminal-vim-header")).toBeVisible();

    const lineNumbers = page.getByTestId("terminal-line-numbers");
    await expect(lineNumbers).toBeAttached();
    await expect(lineNumbers).not.toBeVisible();

    await page.goto("/c/stream");
    await expect(page.getByTestId("grep-filter-input")).toBeVisible();
  });
});
