import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

const lighthouseMode = process.env.PW_LIGHTHOUSE === "1";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: lighthouseMode ? 180_000 : 60_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /lighthouse-home\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "lighthouse-mobile",
      testMatch: /lighthouse-home\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
  webServer: lighthouseMode
    ? {
        command:
          "pnpm build && pnpm exec next start --hostname 127.0.0.1 --port 3000",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      }
    : {
        command:
          "pnpm exec next dev --turbo --hostname 127.0.0.1 --port 3000",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
