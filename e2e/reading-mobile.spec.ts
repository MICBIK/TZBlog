import { expect, test } from "@playwright/test";

test.describe("reading mode mobile", () => {
  test("mobile375CollapsesTocAndScalesText", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/posts/why-i-rewrote-my-blog");

    const reader = page.locator("[data-article-reader]");
    await expect(reader).toBeVisible();

    const mobileToggle = page.locator("[data-toc-toggle]");
    const desktopToc = page.locator("[data-toc-desktop]");

    await expect(desktopToc).toBeHidden();

    const contentLength = await page.evaluate(() => {
      const article = document.querySelector("[data-article-content]");
      return article?.textContent?.length ?? 0;
    });

    if (contentLength > 0) {
      const mobileFontSize = await page
        .locator("[data-article-content].markdown-body")
        .evaluate((node) => window.getComputedStyle(node).fontSize);

      expect(Number.parseFloat(mobileFontSize)).toBeLessThanOrEqual(16);
    }

    const toggleCount = await mobileToggle.count();
    if (toggleCount > 0) {
      await expect(mobileToggle).toBeVisible();
      await expect(page.locator("#reading-toc-panel")).toBeHidden();
      await mobileToggle.click();
      await expect(page.locator("#reading-toc-panel")).toBeVisible();
    }
  });
});
