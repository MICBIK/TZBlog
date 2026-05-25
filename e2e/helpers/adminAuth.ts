import { expect, type Page } from "@playwright/test";

export function adminCredentials(): { email: string; password: string } {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD is required for admin e2e tests. Set it in .env before running Playwright.",
    );
  }

  return { email, password };
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = adminCredentials();

  await page.goto("/login?from=/admin");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();

  await page.waitForURL(
    (url) => url.pathname === "/admin" || url.pathname.startsWith("/admin/"),
    { timeout: 15_000 },
  );

  await expect(page.getByRole("heading", { name: "仪表盘" })).toBeVisible();
}
