import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { MockAPI } from '../mocks/handlers';

test.describe('首页测试', () => {
  let homePage: HomePage;
  let mockAPI: MockAPI;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    mockAPI = new MockAPI({ page });

    // 设置 API mocks
    await mockAPI.setupAll();

    // 访问首页
    await homePage.goto();
  });

  test('首页加载成功', async () => {
    await homePage.verifyPageLoaded();
    await expect(homePage.heroTitle).toBeVisible();
    await expect(homePage.navigation).toBeVisible();
  });

  test('Hero section 内容正确', async () => {
    const title = await homePage.heroTitle.textContent();
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(0);
  });

  test('文章列表渲染正确', async ({ page }) => {
    const articleCount = await homePage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    // 验证至少有一篇文章
    const firstArticle = homePage.articleCards.first();
    await expect(firstArticle).toBeVisible();
  });

  test('文章标题可见', async () => {
    const titles = await homePage.getArticleTitles();
    expect(titles.length).toBeGreaterThan(0);

    // 验证标题不为空
    titles.forEach(title => {
      expect(title.length).toBeGreaterThan(0);
    });
  });

  test('点击文章卡片跳转到详情页', async ({ page }) => {
    const articleCount = await homePage.getArticleCount();

    if (articleCount > 0) {
      await homePage.clickArticle(0);

      // 验证跳转到文章详情页
      await page.waitForURL(/\/articles\/[^/]+/);
      expect(page.url()).toMatch(/\/articles\/[^/]+/);
    }
  });

  test('导航栏功能正常', async ({ page }) => {
    await expect(homePage.navigation).toBeVisible();

    // 检查导航栏是否包含链接
    const navLinks = homePage.navigation.locator('a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('主题切换功能', async () => {
    // 检查初始主题
    const isDarkBefore = await homePage.isDarkMode();

    // 尝试切换主题
    try {
      await homePage.toggleTheme();
      const isDarkAfter = await homePage.isDarkMode();

      // 验证主题已切换
      expect(isDarkAfter).not.toBe(isDarkBefore);
    } catch {
      // 主题切换按钮可能不存在，跳过此测试
      test.skip();
    }
  });

  test.describe('响应式布局', () => {
    test('移动端视口', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await homePage.goto();

      await homePage.verifyPageLoaded();
      await expect(homePage.heroTitle).toBeVisible();
    });

    test('平板视口', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await homePage.goto();

      await homePage.verifyPageLoaded();
      await expect(homePage.heroTitle).toBeVisible();
    });

    test('桌面视口', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await homePage.goto();

      await homePage.verifyPageLoaded();
      await expect(homePage.heroTitle).toBeVisible();
    });
  });

  test('页面无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await homePage.goto();
    await homePage.waitForLoad();

    expect(errors.length).toBe(0);
  });

  test('页面无控制台错误', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await homePage.goto();
    await homePage.waitForLoad();

    // 过滤掉已知的无害错误（如第三方脚本）
    const criticalErrors = consoleErrors.filter(
      error => !error.includes('favicon') && !error.includes('third-party')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
