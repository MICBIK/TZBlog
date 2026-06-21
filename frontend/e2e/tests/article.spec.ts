import { test, expect } from '@playwright/test';
import { ArticlePage } from '../pages/ArticlePage';
import { MockAPI } from '../mocks/handlers';

test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

test.describe('文章详情页测试', () => {
  let articlePage: ArticlePage;

  test.beforeEach(async ({ page }) => {
    articlePage = new ArticlePage(page);
    const mockAPI = new MockAPI({ page });
    await mockAPI.setupAll();
    await articlePage.goto('spec-first-workflow');
  });

  test('文章详情页加载固定正文', async () => {
    await articlePage.verifyPageLoaded();
    await expect(articlePage.articleTitle).toContainText(
      '我用 spec-first 工作流让 Claude 连续写对 3000 行代码',
    );
    await expect(articlePage.articleContent).toContainText('失败轨迹回放');
  });

  test('TOC 渲染四个固定章节', async () => {
    expect(await articlePage.getTocLinkCount()).toBe(4);
    await expect(articlePage.toc).toContainText('为什么 prompt 越写越长反而越糟');
    await expect(articlePage.toc).toContainText('spec-first：先写验收脚本');
    await expect(articlePage.toc).toContainText('最便宜的验证层放在哪');
    await expect(articlePage.toc).toContainText('失败轨迹回放');
  });

  test('点击 TOC 会触发页面滚动', async () => {
    await articlePage.verifyTocScrolling(1);
  });

  test('代码块高亮与复制按钮可用', async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await articlePage.verifyCodeHighlight();
    await articlePage.clickCopyButton();

    await expect(articlePage.copyButton).toContainText('copied');
    const clipboard = await articlePage.page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboard).toContain('pnpm tsc --noEmit');
    expect(clipboard).toContain('pnpm vitest run spec/checkout');
  });

  test('标签与作者信息可见', async () => {
    const tags = await articlePage.getTags();

    await expect(articlePage.authorInfo).toBeVisible();
    expect(tags).toContain('AI Coding');
    expect(tags).toContain('工作流');
  });

  test('未实现上下篇时不展示硬编码导航', async () => {
    expect(await articlePage.getRelatedArticleCount()).toBe(0);
  });

  test('评论区展示真实列表并可见发布框', async () => {
    await articlePage.scrollToComments();
    await expect(articlePage.commentInput).toBeVisible();
    await expect(articlePage.commentItems.first()).toBeVisible();
  });

  test('页面标题与摘要可见', async () => {
    await expect(articlePage.articleTitle).toContainText('spec-first 工作流');
    await expect(articlePage.articleContent).toContainText('规格驱动');
  });

  test.describe('响应式布局', () => {
    test('移动端文章仍可阅读', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await articlePage.goto('spec-first-workflow');

      await expect(articlePage.articleTitle).toBeVisible();
      await expect(articlePage.commentInput).toBeVisible();
    });

    test('平板端 TOC 仍可见', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await articlePage.goto('spec-first-workflow');

      await expect(articlePage.toc).toBeVisible();
    });
  });
});

// R34: 路由契约 smoke —— 不依赖宽松 mock，直接监听前端真实发出的详情请求 URL，
// 断言其命中后端 canonical 路由 `/api/v1/articles/<slug>`，绝不能回到已废弃的
// `/api/v1/articles/slug/<slug>`（R04 漂移 bug 类）。这样即便 mock 写得很宽松，
// 前后端路径再次漂移时此用例也会立即失败。
test.describe('文章详情 API 路由契约 (R34)', () => {
  test('详情请求命中 /api/v1/articles/<slug> 而非 /articles/slug/<slug>', async ({
    page,
  }) => {
    const slug = 'spec-first-workflow';
    const articleRequests: string[] = [];

    // 监听所有命中 /api/v1/articles 的请求 URL（spy，不改变响应）
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/v1/articles')) {
        articleRequests.push(url);
      }
    });

    const mockAPI = new MockAPI({ page });
    await mockAPI.setupAll();

    const articlePage = new ArticlePage(page);
    await articlePage.goto(slug);

    // 至少有一条 canonical 详情请求
    const canonical = articleRequests.filter((u) =>
      new RegExp(`/api/v1/articles/${slug}(\\?.*)?$`).test(u),
    );
    expect(canonical.length).toBeGreaterThan(0);

    // 绝不能出现已漂移的 /articles/slug/<slug> 路径
    const drifted = articleRequests.filter((u) =>
      u.includes(`/api/v1/articles/slug/`),
    );
    expect(drifted).toEqual([]);
  });
});
