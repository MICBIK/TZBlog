import { expect, test } from "@playwright/test";

test("newChannelAppearsWithoutCodeChange", async ({ page }) => {
  test.setTimeout(60_000);

  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is required for home-dynamic-channel e2e");
  }

  const slug = `e2e-lab-${Date.now()}`;
  const channelName = "E2E 动态频道";

  await page.goto("/login?from=/admin");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();
  await page.waitForURL("**/admin**");

  const createResponse = await page.request.post("/api/admin/channels", {
    data: {
      slug,
      kind: "NOTES",
      layout: "TIMELINE",
      enabled: true,
      translations: [{ locale: "zh", name: channelName, description: null }],
    },
  });

  expect(createResponse.ok()).toBeTruthy();

  await page.goto("/");

  await expect(page.getByTestId(`channel-preview-${slug}`)).toBeVisible();
  await expect(
    page.getByTestId(`channel-preview-${slug}`).getByRole("heading", {
      name: channelName,
    }),
  ).toBeVisible();
});
