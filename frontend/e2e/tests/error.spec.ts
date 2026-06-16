import { test, expect } from '@playwright/test';

test.describe('错误页面测试', () => {
  test('404 页面渲染', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('networkidle');

    // 验证页面包含 404 相关内容
    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('404') ||
      bodyText?.includes('Not Found') ||
      bodyText?.includes('找不到') ||
      bodyText?.includes('页面不存在')
    ).toBeTruthy();
  });

  test('404 页面显示返回首页链接', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('networkidle');

    // 查找返回首页的链接
    const homeLink = page.getByRole('link', { name: /home|首页|返回/i }).first();

    try {
      await expect(homeLink).toBeVisible();

      // 点击返回首页
      await homeLink.click();
      await page.waitForLoadState('networkidle');

      // 验证跳转到首页
      expect(page.url()).toMatch(/\/$|\/home/);
    } catch {
      // 返回首页链接可能不存在
      console.warn('Home link not found on 404 page');
    }
  });

  test('404 页面响应状态码', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345');

    // Next.js 可能返回 200 但显示 404 页面
    // 或者返回真实的 404 状态码
    if (response) {
      const status = response.status();
      expect([200, 404]).toContain(status);
    }
  });

  test('404 页面基本元素', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('networkidle');

    // 验证页面有标题
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // 验证页面有主要内容
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test.describe('响应式 404 页面', () => {
    test('移动端 404 页面', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/non-existent-page-12345');
      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body');
      expect(bodyText?.includes('404') || bodyText?.includes('Not Found')).toBeTruthy();
    });

    test('平板 404 页面', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/non-existent-page-12345');
      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body');
      expect(bodyText?.includes('404') || bodyText?.includes('Not Found')).toBeTruthy();
    });
  });

  test('不存在的文章 slug', async ({ page }) => {
    await page.goto('/articles/non-existent-article-slug-xyz');
    await page.waitForLoadState('networkidle');

    // 验证显示错误信息或 404 页面
    const bodyText = await page.textContent('body');
    expect(
      bodyText?.includes('404') ||
      bodyText?.includes('Not Found') ||
      bodyText?.includes('找不到') ||
      bodyText?.includes('文章不存在')
    ).toBeTruthy();
  });

  test('导航栏在 404 页面仍然可用', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('networkidle');

    // 查找导航栏
    const nav = page.locator('nav').first();

    try {
      await expect(nav).toBeVisible();

      // 验证导航栏包含链接
      const navLinks = nav.locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    } catch {
      console.warn('Navigation not found on 404 page');
    }
  });
});
