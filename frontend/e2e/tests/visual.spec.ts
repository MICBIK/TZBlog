import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { MockAPI } from '../mocks/handlers';

test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

test.describe('视觉回归测试', () => {
  test.beforeEach(async ({ page }) => {
    const mockAPI = new MockAPI({ page });
    await mockAPI.setupAll();
  });

  test('navigation 组件截图', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.navigation).toHaveScreenshot('navigation.png', {
      maxDiffPixels: 50,
    });
  });

  test('hero 区域截图', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.hero).toHaveScreenshot('hero.png', {
      maxDiffPixels: 100,
    });
  });

  test('文章卡片截图', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const firstArticle = homePage.articleCards.first();
    await firstArticle.scrollIntoViewIfNeeded();

    await expect(firstArticle).toHaveScreenshot('article-card.png', {
      maxDiffPixels: 50,
    });
  });

  test('文章卡片 hover 状态截图', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const firstArticle = homePage.articleCards.first();
    await firstArticle.scrollIntoViewIfNeeded();
    await firstArticle.hover();

    await expect(firstArticle).toHaveScreenshot('article-card-hover.png', {
      maxDiffPixels: 1000,
    });
  });

  test('404 页面截图', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await expect(page.locator('main')).toBeVisible();

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
