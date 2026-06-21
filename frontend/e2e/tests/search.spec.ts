import { test, expect } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';
import { MockAPI } from '../mocks/handlers';

test.describe.configure({ mode: 'serial' });

test.describe('搜索功能测试', () => {
  let searchPage: SearchPage;

  test.beforeEach(async ({ page }) => {
    searchPage = new SearchPage(page);
    const mockAPI = new MockAPI({ page });
    await mockAPI.setupAll();
    await searchPage.goto();
  });

  test('搜索页加载固定文案', async () => {
    await expect(searchPage.searchInput).toBeVisible();
    await expect(searchPage.page.locator('h1')).toContainText('全站搜索');
    await expect(searchPage.page.getByText(/命中/)).toBeVisible();
  });

  test('输入 spec-first 后只保留匹配结果', async () => {
    await searchPage.search('spec-first');

    await searchPage.verifyHasResults();
    expect(await searchPage.getResultCount()).toBe(1);
    await expect(searchPage.resultItems.first()).toContainText(
      '我用 spec-first 工作流让 Claude 连续写对 3000 行代码',
    );
  });

  test('无结果时显示 empty state', async () => {
    const query = '非常罕见的关键词XYZ123';

    await searchPage.search(query);

    expect(await searchPage.getResultCount()).toBe(0);
    await searchPage.verifyEmptyState();
    await expect(searchPage.page.locator('b').filter({ hasText: `"${query}"` })).toBeVisible();
  });

  test('关键词会被 mark 高亮', async () => {
    await searchPage.search('spec');

    await searchPage.verifyHasResults();
    await searchPage.verifyHighlight('spec');
  });

  test('分类 chip 会收窄结果范围', async () => {
    await searchPage.selectCategory('Frontend');
    await searchPage.verifyHasResults();

    const titles = await searchPage.getResultTitles();
    expect(await searchPage.getResultCount()).toBe(2);
    expect(titles).toContain('Getting Started with Next.js 15');
    expect(titles).toContain('TypeScript Best Practices 2026');
  });

  test('点击结果进入真实 slug 页面', async ({ page }) => {
    await searchPage.search('TypeScript');
    await searchPage.verifyHasResults();
    const targetHref = await searchPage.resultItems.first().getAttribute('href');
    await searchPage.clickResult(0);

    expect(targetHref).toMatch(/^\/articles\//);
    await expect(page).toHaveURL(new RegExp(`${targetHref}$`));
  });

  test('清空搜索框会恢复为空字符串', async () => {
    await searchPage.search('Next.js');
    expect(await searchPage.getCurrentQuery()).toBe('Next.js');

    await searchPage.clearSearch();
    expect(await searchPage.getCurrentQuery()).toBe('');
  });

  test('搜索大小写不敏感', async () => {
    const counts: number[] = [];

    for (const query of ['next.js', 'Next.js', 'NEXT.JS']) {
      await searchPage.search(query);
      await searchPage.verifyHasResults();
      counts.push(await searchPage.getResultCount());
      await searchPage.clearSearch();
    }

    expect(counts).toEqual([1, 1, 1]);
  });
});
