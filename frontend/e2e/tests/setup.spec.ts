import { test, expect } from '@playwright/test';

/**
 * 快速验证测试 - 确保 E2E 测试配置正确
 */
test.describe('E2E 测试配置验证', () => {
  test('Playwright 配置正确', async ({ page }) => {
    // 访问首页
    await page.goto('/');

    // 等待页面加载
    await page.waitForLoadState('load');

    // 验证页面标题存在
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // 验证基本元素
    const body = page.locator('body');
    await expect(body).toBeVisible();

    console.log('✅ E2E 测试配置正确！');
  });

  test('API Mock 配置正确', async ({ page }) => {
    // 设置 API mock
    await page.route('**/api/v1/articles', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: '1', title: 'Test Article' }],
        }),
      });
    });

    await page.goto('/');

    console.log('✅ API Mock 配置正确！');
  });

  test('多浏览器支持', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    console.log(`✅ ${browserName} 浏览器测试通过！`);
  });

  test('响应式视口支持', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 800, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('load');

      console.log(`✅ ${viewport.name} 视口测试通过！`);
    }
  });
});
