import { Page, Locator, expect } from '@playwright/test';

/**
 * HomePage Page Object
 * 首页的页面对象模型
 */
export class HomePage {
  readonly page: Page;
  readonly hero: Locator;
  readonly heroTitle: Locator;
  readonly navigation: Locator;
  readonly heroReadLink: Locator;
  readonly articleTitles: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hero = page.locator('main section').first();
    this.heroTitle = page.locator('h1').first();
    this.navigation = page.locator('header nav').first();
    this.heroReadLink = page.getByRole('link', { name: 'read' });
    this.articleTitles = page.locator('main a[href^="/articles/"] h3');
  }

  /**
   * 访问首页
   */
  async goto() {
    await this.page.goto('/');
    await this.waitForLoad();
  }

  /**
   * 等待页面加载完成
   */
  async waitForLoad() {
    await expect(this.heroTitle).toBeVisible();
  }

  /**
   * 获取文章卡片数量
   */
  async getArticleCount(): Promise<number> {
    return await this.articleTitles.count();
  }

  /**
   * 点击第 N 篇文章
   */
  async clickArticle(index: number) {
    await this.articleTitles.nth(index).click();
  }

  /**
   * 导航到指定页面
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForLoad();
  }

  /**
   * 验证首页基本元素可见
   */
  async verifyPageLoaded() {
    await expect(this.heroTitle).toBeVisible();
    await expect(this.navigation).toBeVisible();
  }

  /**
   * 获取文章标题列表
   */
  async getArticleTitles(): Promise<string[]> {
    await expect
      .poll(async () => this.articleTitles.count())
      .toBeGreaterThanOrEqual(1);

    const titles: string[] = [];
    const count = await this.getArticleCount();

    for (let i = 0; i < count; i++) {
      const title = await this.articleTitles.nth(i).textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }
}
