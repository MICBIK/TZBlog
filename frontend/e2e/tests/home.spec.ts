import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { MockAPI } from '../mocks/handlers';

test.describe.configure({ mode: 'serial' });

test.describe('首页测试', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    const mockAPI = new MockAPI({ page });
    await mockAPI.setupAll();
    await homePage.goto();
  });

  test('首页加载出真实 hero 与导航', async () => {
    await homePage.verifyPageLoaded();
    const heroTitle = await homePage.heroTitle.textContent();
    expect(heroTitle?.trim().length).toBeGreaterThan(0);
    await expect(homePage.navigation).toContainText('home');
    await expect(homePage.navigation).toContainText('search');
    await expect(homePage.heroReadLink).toHaveAttribute('href', /\/articles\/.+/);
  });

  test('文章流渲染真实文章列表', async () => {
    const titles = await homePage.getArticleTitles();

    expect(titles.length).toBeGreaterThanOrEqual(2);
    expect(titles).toContain('Getting Started with Next.js 15');
    expect(titles).toContain('TypeScript Best Practices 2026');
  });

  test('点击 hero 文章进入对应详情页', async ({ page }) => {
    const targetHref = await homePage.heroReadLink.getAttribute('href');
    await homePage.heroReadLink.click();

    expect(targetHref).toMatch(/^\/articles\/.+/);
    await expect(page).toHaveURL(new RegExp(`${targetHref}$`));
    await expect(page.locator('h1').first()).toHaveText(/.+/);
  });

  test('页面没有 runtime error', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await homePage.goto();

    expect(pageErrors).toEqual([]);
    expect(
      consoleErrors.filter(
        (error) =>
          !error.includes('favicon') && !error.includes('Failed to load resource'),
      ),
    ).toEqual([]);
  });

  test.describe('响应式布局', () => {
    test('移动端仍能看到 hero 标题', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await homePage.goto();

      await expect(homePage.heroTitle).toBeVisible();
      await expect(page.getByRole('button', { name: '菜单' })).toBeVisible();
    });

    test('平板端仍能看到导航与文章流', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await homePage.goto();

      await expect(homePage.navigation).toBeVisible();
      expect(await homePage.getArticleCount()).toBeGreaterThanOrEqual(2);
    });
  });
});
