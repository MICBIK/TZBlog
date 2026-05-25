import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "./helpers/adminAuth";

test("newChannelAppearsWithoutCodeChange", async ({ page }) => {
  test.setTimeout(60_000);

  const slug = `e2e-lab-${Date.now()}`;
  const channelName = "E2E 动态频道";

  await loginAsAdmin(page);

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
