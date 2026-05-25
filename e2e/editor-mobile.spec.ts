import { expect, test } from "@playwright/test";

test("editorDoesNotOverflowAt375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/_editor-smoke");

  const editor = page.locator("[data-milkdown-editor]");
  await expect(editor).toBeVisible();

  const dimensions = await editor.evaluate((node) => {
    const root = document.documentElement;
    const body = document.body;
    const rect = node.getBoundingClientRect();

    return {
      viewportWidth: window.innerWidth,
      editorWidth: rect.width,
      rootScrollWidth: root.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
    };
  });

  expect(dimensions.editorWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.rootScrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});
