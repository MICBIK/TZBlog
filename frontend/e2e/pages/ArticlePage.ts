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
  readonly codeBlocks: Locator;
  readonly copyButtons: Locator;
  readonly authorInfo: Locator;
  readonly tags: Locator;
  readonly likeButton: Locator;
  readonly shareButton: Locator;
  readonly commentSection: Locator;
  readonly relatedArticles: Locator;

  constructor(page: Page) {
    this.page = page;
    this.articleTitle = page.locator('h1').first();
    this.articleContent = page.locator('[data-testid="article-content"]').or(page.locator('article').first());
    this.toc = page.locator('[data-testid="toc"]').or(page.locator('nav').filter({ hasText: /目录|table of contents/i }));
    this.tocLinks = this.toc.locator('a');
    this.codeBlocks = page.locator('pre code');
    this.copyButtons = page.locator('[data-testid="copy-button"]').or(page.locator('button').filter({ hasText: /copy/i }));
    this.authorInfo = page.locator('[data-testid="author-info"]').or(page.locator('[class*="author"]').first());
    this.tags = page.locator('[data-testid="tags"]').or(page.locator('a[href*="/tags/"]'));
    this.likeButton = page.getByRole('button', { name: /like|点赞/i });
    this.shareButton = page.getByRole('button', { name: /share|分享/i });
    this.commentSection = page.locator('[data-testid="comments"]').or(page.locator('section').filter({ hasText: /comment|评论/i }));
    this.relatedArticles = page.locator('[data-testid="related-articles"]');
  }

  /**
   * 访问文章详情页
   */
  async goto(slug: string) {
    await this.page.goto(`/articles/${slug}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 等待页面加载完成
   */
  async waitForLoad() {
    await this.page.waitForLoadState('load');
    await this.articleTitle.waitFor({ state: 'visible' });
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
    // 等待滚动动画完成
    await this.page.waitForTimeout(300);
  }

  /**
   * 获取 TOC 链接数量
   */
  async getTocLinkCount(): Promise<number> {
    try {
      return await this.tocLinks.count();
    } catch {
      return 0;
    }
  }

  /**
   * 点击代码块的复制按钮
   */
  async clickCopyButton(index: number = 0) {
    const button = this.copyButtons.nth(index);
    await button.waitFor({ state: 'visible' });
    await button.click();
  }

  /**
   * 获取代码块数量
   */
  async getCodeBlockCount(): Promise<number> {
    return await this.codeBlocks.count();
  }

  /**
   * 验证代码块高亮
   */
  async verifyCodeHighlight(index: number = 0) {
    const codeBlock = this.codeBlocks.nth(index);
    await expect(codeBlock).toBeVisible();

    // 检查是否有语法高亮的类名或内联样式
    const hasHighlight = await codeBlock.evaluate(el => {
      const hasClass = el.className.length > 0;
      const hasChildren = el.children.length > 0;
      return hasClass || hasChildren;
    });

    expect(hasHighlight).toBeTruthy();
  }

  /**
   * 点击点赞按钮
   */
  async clickLike() {
    try {
      await this.likeButton.click();
    } catch {
      // 点赞按钮可能不存在
    }
  }

  /**
   * 滚动到评论区
   */
  async scrollToComments() {
    try {
      await this.commentSection.scrollIntoViewIfNeeded();
    } catch {
      // 评论区可能不存在
    }
  }

  /**
   * 获取相关文章数量
   */
  async getRelatedArticleCount(): Promise<number> {
    try {
      const articles = this.relatedArticles.locator('article, a');
      return await articles.count();
    } catch {
      return 0;
    }
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
    const scrollBefore = await this.getScrollPosition();
    await this.clickTocLink(linkIndex);
    await this.page.waitForTimeout(500);
    const scrollAfter = await this.getScrollPosition();

    // 验证滚动位置改变
    expect(scrollAfter).not.toBe(scrollBefore);
  }
}
