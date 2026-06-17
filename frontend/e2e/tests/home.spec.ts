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
    await expect(homePage.heroTitle).toContainText(
      '我用 spec-first 工作流让 Claude 连续写对 3000 行代码',
    );
    await expect(homePage.navigation).toContainText('home');
    await expect(homePage.navigation).toContainText('search');
    await expect(homePage.heroReadLink).toHaveAttribute(
      'href',
      '/articles/spec-first-workflow',
    );
  });

  test('文章流渲染固定内容', async () => {
    const titles = await homePage.getArticleTitles();

    expect(titles.length).toBeGreaterThanOrEqual(4);
    expect(titles).toContain('Next.js 15 RSC 缓存的 7 个坑，以及我后来怎么排的');
    expect(titles).toContain('把后端从 Node 重写成 Go：p99 从 120ms 压到 18ms 的全过程');
    expect(titles).toContain('2026 我的终端配置：zsh + 一套自己写的 git 别名');
  });

  test('点击 pinned article 进入文章详情页', async ({ page }) => {
    await homePage.heroReadLink.click();

    await expect(page).toHaveURL(/\/articles\/spec-first-workflow$/);
    await expect(page.locator('h1').first()).toContainText(
      '我用 spec-first 工作流让 Claude 连续写对 3000 行代码',
    );
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
      expect(await homePage.getArticleCount()).toBeGreaterThanOrEqual(4);
    });
  });
});
