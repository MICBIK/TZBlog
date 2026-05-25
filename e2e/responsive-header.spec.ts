import { expect, test } from "@playwright/test";

test("mobile375CollapsesToHamburgerMenu", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const toggle = page.locator("[data-site-nav-toggle]");
  const desktopNav = page.locator("[data-site-header-nav]");
  const mobileNav = page.locator("[data-site-mobile-nav]");

  await expect(toggle).toBeVisible();
  await expect(desktopNav).toBeHidden();
  await expect(mobileNav).toBeHidden();

  await toggle.click();

  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "关于" })).toBeVisible();
});
