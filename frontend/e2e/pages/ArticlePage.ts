import { Page, Locator, expect } from '@playwright/test';

/**
 * ArticlePage Page Object
 * 文章详情页的页面对象模型
 */
export class ArticlePage {
  readonly page: Page;
  readonly articleTitle: Locator;
  readonly articleContent: Locator;
  readonly toc: Locator;
  readonly tocLinks: Locator;
  readonly codeBlock: Locator;
  readonly copyButton: Locator;
  readonly authorInfo: Locator;
  readonly tags: Locator;
  readonly likeButton: Locator;
  readonly shareButton: Locator;
  readonly commentSection: Locator;
  readonly commentInput: Locator;
  readonly publishButton: Locator;
  readonly relatedArticles: Locator;
  readonly commentItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.articleTitle = page.locator('h1').first();
    this.articleContent = page.locator('main article').first();
    this.toc = page.locator('aside nav').first();
    this.tocLinks = this.toc.locator('a');
    this.codeBlock = page.locator('pre').first();
    this.copyButton = page.getByRole('button', { name: /copy|copied/i }).first();
    this.authorInfo = page.getByText('haiden').first();
    this.tags = page
      .locator('article a[href^="/articles?tag="]')
      .filter({ hasText: /AI Coding|prompt|agent|工作流/ });
    this.likeButton = page.getByRole('button', { name: /赞/ });
    this.shareButton = page.getByRole('button', { name: /分享/ });
    this.commentSection = page.locator('section').filter({ hasText: /comments\.log|条评论/ }).first();
    this.commentInput = page.getByPlaceholder('// 写下你的想法… 登录后发布');
    this.publishButton = page.getByRole('button', { name: '发布' });
    this.relatedArticles = page.locator('article a[href^="/articles/"]').filter({ hasText: /Next\.js 15 RSC 缓存的 7 个坑|把后端从 Node 重写成 Go/ });
    this.commentItems = this.commentSection.locator('.border-line.bg-panel');
  }

  /**
   * 访问文章详情页
   */
  async goto(slug: string) {
    await this.page.goto(`/articles/${slug}`);
    await this.waitForLoad();
  }

  /**
   * 等待页面加载完成
   */
  async waitForLoad() {
    await expect(this.articleTitle).toBeVisible();
    await expect(this.articleContent).toBeVisible();
  }

  /**
   * 获取文章标题
   */
  async getTitle(): Promise<string> {
    return (await this.articleTitle.textContent()) || '';
  }

  /**
   * 点击 TOC 中的某个链接
   */
  async clickTocLink(index: number) {
    await this.tocLinks.nth(index).click();
  }

  /**
   * 获取 TOC 链接数量
   */
  async getTocLinkCount(): Promise<number> {
    return this.tocLinks.count();
  }

  /**
   * 点击代码块的复制按钮
   */
  async clickCopyButton() {
    await this.copyButton.click();
  }

  /**
   * 获取代码块数量
   */
  async getCodeBlockCount(): Promise<number> {
    return this.page.locator('pre').count();
  }

  /**
   * 验证代码块高亮
   */
  async verifyCodeHighlight() {
    await expect(this.codeBlock).toBeVisible();
    const hasHighlight = await this.codeBlock.locator('span').count();
    expect(hasHighlight).toBeGreaterThan(0);
  }

  /**
   * 点击点赞按钮
   */
  async clickLike() {
    await this.likeButton.click();
  }

  /**
   * 滚动到评论区
   */
  async scrollToComments() {
    await this.commentSection.scrollIntoViewIfNeeded();
  }

  /**
   * 获取相关文章数量
   */
  async getRelatedArticleCount(): Promise<number> {
    return this.relatedArticles.count();
  }

  /**
   * 获取标签列表
   */
  async getTags(): Promise<string[]> {
    const tags: string[] = [];
    const count = await this.tags.count();

    for (let i = 0; i < count; i++) {
      const tag = await this.tags.nth(i).textContent();
      if (tag) tags.push(tag.trim());
    }

    return tags;
  }

  /**
   * 验证文章页基本元素
   */
  async verifyPageLoaded() {
    await expect(this.articleTitle).toBeVisible();
    await expect(this.articleContent).toBeVisible();
  }

  /**
   * 获取当前滚动位置
   */
  async getScrollPosition(): Promise<number> {
    return await this.page.evaluate(() => window.scrollY);
  }

  /**
   * 验证 TOC 点击后滚动
   */
  async verifyTocScrolling(linkIndex: number) {
    await this.commentSection.scrollIntoViewIfNeeded();

    const href = await this.tocLinks.nth(linkIndex).getAttribute('href');
    expect(href).toBeTruthy();

    await this.clickTocLink(linkIndex);
    const expectedHash = href ? encodeURI(href) : '';
    await expect(this.page).toHaveURL(new RegExp(`${expectedHash}$`));

    await expect
      .poll(async () => {
        return this.page.locator(href!).evaluate((el) => {
          return Math.abs(el.getBoundingClientRect().top);
        });
      })
      .toBeLessThan(220);
  }
}
