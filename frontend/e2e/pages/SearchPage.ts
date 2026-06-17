import { Page, Locator, expect } from '@playwright/test';

/**
 * SearchPage Page Object
 * 搜索页面的页面对象模型
 */
export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly resultsSection: Locator;
  readonly resultItems: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('textbox', { name: '搜索文章' });
    this.resultsSection = page.locator('main section').last();
    this.resultItems = this.resultsSection.locator('a[href="/articles/spec-first-workflow"]');
    this.emptyState = page.getByText(/没有匹配/);
  }

  /**
   * 访问搜索页
   */
  async goto(query?: string) {
    const url = query ? `/search?q=${encodeURIComponent(query)}` : '/search';
    await this.page.goto(url);
    await expect(this.searchInput).toBeVisible();
  }

  /**
   * 输入搜索关键词
   */
  async typeQuery(query: string) {
    await this.searchInput.fill(query);
  }

  /**
   * 执行搜索
   */
  async search(query: string) {
    await this.typeQuery(query);
    await expect(this.searchInput).toHaveValue(query);
  }

  /**
   * 获取搜索结果数量
   */
  async getResultCount(): Promise<number> {
    return this.resultItems.count();
  }

  /**
   * 验证空结果状态
   */
  async verifyEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * 验证有搜索结果
   */
  async verifyHasResults() {
    const count = await this.getResultCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * 点击搜索结果
   */
  async clickResult(index: number) {
    await this.resultItems.nth(index).click();
  }

  /**
   * 获取搜索结果标题列表
   */
  async getResultTitles(): Promise<string[]> {
    const titles: string[] = [];
    const count = await this.getResultCount();

    for (let i = 0; i < count; i++) {
      const title = await this.resultItems.nth(i).locator('h2, h3').first().textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  /**
   * 验证搜索关键词高亮
   */
  async verifyHighlight(keyword: string) {
    const highlightedText = this.page.locator('mark').filter({ hasText: keyword });
    const count = await highlightedText.count();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * 选择分类
   */
  async selectCategory(label: string) {
    await this.page.getByRole('button', { name: label }).click();
  }

  /**
   * 清空搜索框
   */
  async clearSearch() {
    await this.searchInput.clear();
  }

  /**
   * 获取当前搜索关键词
   */
  async getCurrentQuery(): Promise<string> {
    return (await this.searchInput.inputValue()) || '';
  }
}
