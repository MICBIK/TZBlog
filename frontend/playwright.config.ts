import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * 文档: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e/tests',

  /* 并行执行测试 */
  fullyParallel: true,

  /* 失败时重试次数 */
  retries: process.env.CI ? 2 : 0,

  /* 并行工作线程数 */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter 配置 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  /* 共享设置 */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:3000',

    /* 失败时截图 */
    screenshot: 'only-on-failure',

    /* 失败时录制视频 */
    video: 'retain-on-failure',

    /* 失败时收集 trace */
    trace: 'on-first-retry',
  },

  /* 测试项目配置 - 多浏览器和视口 */
  projects: [
    /* Desktop Chromium */
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },

    /* Desktop Firefox */
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 800 },
      },
    },

    /* Desktop WebKit */
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 800 },
      },
    },

    /* Mobile Chrome */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    /* Mobile Safari */
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    /* Tablet */
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],

  /* 自动启动开发服务器 */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120 * 1000,
  },
});
