import { test, expect } from "@playwright/test";

test.describe("grep layout mobile", () => {
  test("grepLayoutMobileHorizontalScroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/c/links");

    const layout = page.getByTestId("grep-layout");
    await expect(layout).toBeVisible();

    const tableWrapper = layout.locator(".overflow-x-auto");
    await expect(tableWrapper).toBeVisible();

    const scrollWidth = await tableWrapper.evaluate((node) => node.scrollWidth);
    const clientWidth = await tableWrapper.evaluate((node) => node.clientWidth);
    expect(scrollWidth).toBeGreaterThanOrEqual(clientWidth);
  });
});
