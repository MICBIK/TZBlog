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

  test('上一篇下一篇导航渲染', async () => {
    expect(await articlePage.getRelatedArticleCount()).toBe(2);
    await expect(articlePage.relatedArticles.first()).toBeVisible();
    await expect(articlePage.page.getByText('Next.js 15 RSC 缓存的 7 个坑')).toBeVisible();
    await expect(articlePage.page.getByText('把后端从 Node 重写成 Go')).toBeVisible();
  });

  test('评论区发布按钮显示登录提示', async () => {
    await articlePage.scrollToComments();
    await expect(articlePage.commentInput).toBeVisible();

    await articlePage.publishButton.click();
    await expect(
      articlePage.page.getByText('登录后即可发布评论（GitHub / Google / 邮箱）'),
    ).toBeVisible();
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
