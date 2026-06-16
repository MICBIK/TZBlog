import { Page, Locator, expect } from '@playwright/test';

/**
 * HomePage Page Object
 * 首页的页面对象模型
 */
export class HomePage {
  readonly page: Page;
  readonly hero: Locator;
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly articleList: Locator;
  readonly articleCards: Locator;
  readonly navigation: Locator;
  readonly searchButton: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hero = page.locator('[data-testid="hero-section"]').or(page.locator('section').first());
    this.heroTitle = page.locator('h1').first();
    this.heroSubtitle = page.locator('[data-testid="hero-subtitle"]').or(page.locator('p').first());
    this.articleList = page.locator('[data-testid="article-list"]').or(page.locator('article').first().locator('..'));
    this.articleCards = page.locator('article');
    this.navigation = page.locator('nav').first();
    this.searchButton = page.getByRole('button', { name: /search/i }).or(page.locator('[aria-label*="search" i]'));
    this.themeToggle = page.getByRole('button', { name: /theme/i }).or(page.locator('[aria-label*="theme" i]'));
  }

  /**
   * 访问首页
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 等待页面加载完成
   */
  async waitForLoad() {
    await this.page.waitForLoadState('load');
    await this.heroTitle.waitFor({ state: 'visible' });
  }

  /**
   * 获取文章卡片数量
   */
  async getArticleCount(): Promise<number> {
    return await this.articleCards.count();
  }

  /**
   * 点击第 N 篇文章
   */
  async clickArticle(index: number) {
    await this.articleCards.nth(index).click();
  }

  /**
   * 点击搜索按钮
   */
  async clickSearch() {
    await this.searchButton.click();
  }

  /**
   * 切换主题
   */
  async toggleTheme() {
    await this.themeToggle.click();
    // 等待主题切换动画完成
    await this.page.waitForTimeout(300);
  }

  /**
   * 检查是否为暗黑模式
   */
  async isDarkMode(): Promise<boolean> {
    const html = this.page.locator('html');
    const className = await html.getAttribute('class');
    return className?.includes('dark') || false;
  }

  /**
   * 导航到指定页面
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
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
    const titles: string[] = [];
    const count = await this.getArticleCount();

    for (let i = 0; i < count; i++) {
      const title = await this.articleCards.nth(i).locator('h2, h3').first().textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }
}
