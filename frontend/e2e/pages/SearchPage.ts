import { Page, Locator, expect } from '@playwright/test';

/**
 * SearchPage Page Object
 * 搜索页面的页面对象模型
 */
export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchResults: Locator;
  readonly resultItems: Locator;
  readonly emptyState: Locator;
  readonly resultCount: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('textbox', { name: /search/i }).or(page.locator('input[type="search"]'));
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.searchResults = page.locator('[data-testid="search-results"]').or(page.locator('[class*="search-results"]'));
    this.resultItems = page.locator('[data-testid="search-result-item"]').or(page.locator('article'));
    this.emptyState = page.locator('[data-testid="empty-state"]').or(page.getByText(/no results|没有结果/i));
    this.resultCount = page.locator('[data-testid="result-count"]');
    this.loadingSpinner = page.locator('[data-testid="loading"]').or(page.locator('[role="status"]'));
  }

  /**
   * 访问搜索页
   */
  async goto(query?: string) {
    const url = query ? `/search?q=${encodeURIComponent(query)}` : '/search';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
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
    await this.searchButton.click();

    // 等待搜索完成
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // Loading spinner 可能不存在
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 获取搜索结果数量
   */
  async getResultCount(): Promise<number> {
    try {
      return await this.resultItems.count();
    } catch {
      return 0;
    }
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
    const highlightedText = this.page.locator('mark, [class*="highlight"]').filter({ hasText: keyword });
    const count = await highlightedText.count();
    expect(count).toBeGreaterThan(0);
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
