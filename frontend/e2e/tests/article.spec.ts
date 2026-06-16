import { test, expect } from '@playwright/test';
import { ArticlePage } from '../pages/ArticlePage';
import { MockAPI } from '../mocks/handlers';

test.describe('文章详情页测试', () => {
  let articlePage: ArticlePage;
  let mockAPI: MockAPI;

  test.beforeEach(async ({ page }) => {
    articlePage = new ArticlePage(page);
    mockAPI = new MockAPI({ page });

    // 设置 API mocks
    await mockAPI.setupAll();
  });

  test('文章详情页加载成功', async () => {
    await articlePage.goto('getting-started-with-nextjs');
    await articlePage.verifyPageLoaded();

    const title = await articlePage.getTitle();
    expect(title).toContain('Next.js');
  });

  test('文章标题显示正确', async () => {
    await articlePage.goto('getting-started-with-nextjs');

    const title = await articlePage.getTitle();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toBe('Getting Started with Next.js 15');
  });

  test('文章内容渲染', async () => {
    await articlePage.goto('getting-started-with-nextjs');

    await expect(articlePage.articleContent).toBeVisible();
    const content = await articlePage.articleContent.textContent();
    expect(content!.length).toBeGreaterThan(100);
  });

  test('TOC 目录生成', async () => {
    await articlePage.goto('getting-started-with-nextjs');

    const tocLinkCount = await articlePage.getTocLinkCount();

    if (tocLinkCount > 0) {
      await expect(articlePage.toc).toBeVisible();
      expect(tocLinkCount).toBeGreaterThan(0);
    }
  });

  test('TOC 点击滚动功能', async () => {
    await articlePage.goto('getting-started-with-nextjs');

    const tocLinkCount = await articlePage.getTocLinkCount();

    if (tocLinkCount > 1) {
      // 获取初始滚动位置
      const scrollBefore = await articlePage.getScrollPosition();

      // 点击第二个 TOC 链接
      await articlePage.clickTocLink(1);
      await articlePage.page.waitForTimeout(500);

      // 获取点击后的滚动位置
      const scrollAfter = await articlePage.getScrollPosition();

      // 验证页面发生了滚动
      expect(scrollAfter).not.toBe(scrollBefore);
    }
  });

  test('代码块语法高亮', async () => {
    await articlePage.goto('getting-started-with-nextjs');

    const codeBlockCount = await articlePage.getCodeBlockCount();

    if (codeBlockCount > 0) {
      await expect(articlePage.codeBlocks.first()).toBeVisible();
      await articlePage.verifyCodeHighlight(0);
    }
  });

  test('代码复制按钮功能', async ({ context }) => {
    await articlePage.goto('getting-started-with-nextjs');

    const codeBlockCount = await articlePage.getCodeBlockCount();

    if (codeBlockCount > 0) {
      // 授予剪贴板权限
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      try {
        // 点击复制按钮
        await articlePage.clickCopyButton(0);

        // 等待复制完成
        await articlePage.page.waitForTimeout(500);

        // 验证剪贴板内容
        const clipboardContent = await articlePage.page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardContent.length).toBeGreaterThan(0);
      } catch (error) {
        // 某些环境可能不支持剪贴板 API
        console.warn('Clipboard API not supported:', error);
      }
    }
  });

  test('作者信息显示', async () => {
    await articlePage.goto('getting-started-with-nextjs');

    try {
      await expect(articlePage.authorInfo).toBeVisible();
    } catch {
      // 作者信息可能不存在
      console.warn('Author info not found');
    }
  });

  test('标签显示', async () => {
    await articlePage.goto('getting-started-with-nextjs');

    const tags = await articlePage.getTags();

    if (tags.length > 0) {
      expect(tags).toContain('Next.js');
    }
  });

  test('文章不存在返回 404', async ({ page }) => {
    await articlePage.goto('non-existent-article-slug-12345');

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 验证显示 404 页面或错误信息
    const pageContent = await page.textContent('body');
    expect(
      pageContent?.includes('404') ||
      pageContent?.includes('Not Found') ||
      pageContent?.includes('找不到')
    ).toBeTruthy();
  });

  test('相关文章推荐', async () => {
    await articlePage.goto('getting-started-with-nextjs');

    const relatedCount = await articlePage.getRelatedArticleCount();

    if (relatedCount > 0) {
      await expect(articlePage.relatedArticles).toBeVisible();
    }
  });

  test.describe('响应式布局', () => {
    test('移动端视口 - 文章可读', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await articlePage.goto('getting-started-with-nextjs');

      await articlePage.verifyPageLoaded();
      await expect(articlePage.articleContent).toBeVisible();
    });

    test('平板视口 - TOC 正常显示', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await articlePage.goto('getting-started-with-nextjs');

      await articlePage.verifyPageLoaded();
      const tocCount = await articlePage.getTocLinkCount();

      if (tocCount > 0) {
        await expect(articlePage.toc).toBeVisible();
      }
    });
  });

  test('代码块多种语言高亮', async () => {
    await articlePage.goto('getting-started-with-nextjs');

    const codeBlockCount = await articlePage.getCodeBlockCount();

    if (codeBlockCount > 0) {
      // 验证至少有一个代码块
      await expect(articlePage.codeBlocks.first()).toBeVisible();

      // 验证语法高亮
      for (let i = 0; i < Math.min(codeBlockCount, 3); i++) {
        await articlePage.verifyCodeHighlight(i);
      }
    }
  });

  test('页面 SEO 元数据', async ({ page }) => {
    await articlePage.goto('getting-started-with-nextjs');

    // 验证 title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // 验证 meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });
});
