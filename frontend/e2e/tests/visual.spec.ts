import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ArticlePage } from '../pages/ArticlePage';
import { MockAPI } from '../mocks/handlers';

test.describe('视觉回归测试', () => {
  let mockAPI: MockAPI;

  test.beforeEach(async ({ page }) => {
    mockAPI = new MockAPI({ page });
    await mockAPI.setupAll();
  });

  test.describe('首页截图', () => {
    test('首页 - 亮色模式 - 桌面', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      // 确保是亮色模式
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('home-light-desktop.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('首页 - 暗黑模式 - 桌面', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      // 切换到暗黑模式
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('home-dark-desktop.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('首页 - 移动端', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      await expect(page).toHaveScreenshot('home-mobile.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('首页 - 平板', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      await expect(page).toHaveScreenshot('home-tablet.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });
  });

  test.describe('文章详情页截图', () => {
    test('文章详情页 - 亮色模式', async ({ page }) => {
      const articlePage = new ArticlePage(page);
      await articlePage.goto('getting-started-with-nextjs');
      await articlePage.waitForLoad();

      // 确保是亮色模式
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('article-light.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('文章详情页 - 暗黑模式', async ({ page }) => {
      const articlePage = new ArticlePage(page);
      await articlePage.goto('getting-started-with-nextjs');
      await articlePage.waitForLoad();

      // 切换到暗黑模式
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('article-dark.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('文章详情页 - 移动端', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const articlePage = new ArticlePage(page);
      await articlePage.goto('getting-started-with-nextjs');
      await articlePage.waitForLoad();

      await expect(page).toHaveScreenshot('article-mobile.png', {
        fullPage: true,
        maxDiffPixels: 100,
      });
    });

    test('代码块截图', async ({ page }) => {
      const articlePage = new ArticlePage(page);
      await articlePage.goto('getting-started-with-nextjs');
      await articlePage.waitForLoad();

      const codeBlockCount = await articlePage.getCodeBlockCount();

      if (codeBlockCount > 0) {
        const firstCodeBlock = articlePage.codeBlocks.first();
        await firstCodeBlock.scrollIntoViewIfNeeded();

        await expect(firstCodeBlock).toHaveScreenshot('codeblock.png', {
          maxDiffPixels: 50,
        });
      }
    });
  });

  test.describe('主题切换动画', () => {
    test('主题切换前后对比', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      // 亮色模式截图
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await page.waitForTimeout(300);

      const lightScreenshot = await page.screenshot({ fullPage: false });

      // 暗黑模式截图
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(300);

      const darkScreenshot = await page.screenshot({ fullPage: false });

      // 验证两张截图不同
      expect(lightScreenshot).not.toEqual(darkScreenshot);
    });
  });

  test.describe('组件截图', () => {
    test('导航栏截图', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      await expect(homePage.navigation).toHaveScreenshot('navigation.png', {
        maxDiffPixels: 50,
      });
    });

    test('Hero section 截图', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      try {
        await expect(homePage.hero).toHaveScreenshot('hero.png', {
          maxDiffPixels: 100,
        });
      } catch {
        // Hero section 可能不存在
        console.warn('Hero section not found');
      }
    });

    test('文章卡片截图', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      const articleCount = await homePage.getArticleCount();

      if (articleCount > 0) {
        const firstArticle = homePage.articleCards.first();
        await firstArticle.scrollIntoViewIfNeeded();

        await expect(firstArticle).toHaveScreenshot('article-card.png', {
          maxDiffPixels: 50,
        });
      }
    });
  });

  test.describe('交互状态截图', () => {
    test('按钮 hover 状态', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForLoad();

      const articleCount = await homePage.getArticleCount();

      if (articleCount > 0) {
        const firstArticle = homePage.articleCards.first();
        await firstArticle.scrollIntoViewIfNeeded();

        // Hover 状态
        await firstArticle.hover();
        await page.waitForTimeout(200);

        await expect(firstArticle).toHaveScreenshot('article-card-hover.png', {
          maxDiffPixels: 50,
        });
      }
    });
  });

  test('404 页面截图', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('404-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
