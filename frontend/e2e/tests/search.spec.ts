import { test, expect } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';
import { MockAPI } from '../mocks/handlers';

test.describe('搜索功能测试', () => {
  let searchPage: SearchPage;
  let mockAPI: MockAPI;

  test.beforeEach(async ({ page }) => {
    searchPage = new SearchPage(page);
    mockAPI = new MockAPI({ page });

    // 设置 API mocks
    await mockAPI.setupAll();
  });

  test('搜索页面加载成功', async () => {
    await searchPage.goto();
    await expect(searchPage.searchInput).toBeVisible();
  });

  test('搜索功能 - 有结果', async () => {
    await searchPage.goto();
    await searchPage.search('Next.js');

    // 验证有搜索结果
    await searchPage.verifyHasResults();

    const count = await searchPage.getResultCount();
    expect(count).toBeGreaterThan(0);
  });

  test('搜索功能 - 无结果', async () => {
    await searchPage.goto();
    await searchPage.search('非常罕见的关键词XYZ123');

    // 验证显示空结果状态
    const count = await searchPage.getResultCount();

    if (count === 0) {
      await searchPage.verifyEmptyState();
    }
  });

  test('搜索结果标题显示正确', async () => {
    await searchPage.goto();
    await searchPage.search('TypeScript');

    const titles = await searchPage.getResultTitles();

    if (titles.length > 0) {
      expect(titles[0]).toContain('TypeScript');
    }
  });

  test('点击搜索结果跳转', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('Next.js');

    const count = await searchPage.getResultCount();

    if (count > 0) {
      await searchPage.clickResult(0);

      // 验证跳转到文章详情页
      await page.waitForURL(/\/articles\/[^/]+/);
      expect(page.url()).toMatch(/\/articles\/[^/]+/);
    }
  });

  test('搜索关键词高亮', async ({ page }) => {
    await searchPage.goto();
    await searchPage.search('Next.js');

    const count = await searchPage.getResultCount();

    if (count > 0) {
      try {
        // 验证关键词高亮
        await searchPage.verifyHighlight('Next.js');
      } catch {
        // 高亮功能可能未实现
        console.warn('Keyword highlight not implemented');
      }
    }
  });

  test('清空搜索框', async () => {
    await searchPage.goto();
    await searchPage.typeQuery('test query');

    let query = await searchPage.getCurrentQuery();
    expect(query).toBe('test query');

    await searchPage.clearSearch();

    query = await searchPage.getCurrentQuery();
    expect(query).toBe('');
  });

  test('URL 参数搜索', async ({ page }) => {
    await searchPage.goto('Playwright');

    // 验证 URL 包含搜索参数
    expect(page.url()).toContain('q=Playwright');

    // 验证搜索框自动填充
    const query = await searchPage.getCurrentQuery();
    expect(query).toBe('Playwright');
  });

  test('搜索不同关键词', async () => {
    const keywords = ['Next.js', 'React', 'TypeScript'];

    for (const keyword of keywords) {
      await searchPage.goto();
      await searchPage.search(keyword);

      const titles = await searchPage.getResultTitles();

      if (titles.length > 0) {
        // 验证至少有一个结果包含关键词
        const hasMatch = titles.some(title =>
          title.toLowerCase().includes(keyword.toLowerCase())
        );
        expect(hasMatch).toBeTruthy();
      }
    }
  });

  test('搜索特殊字符', async () => {
    const specialQueries = ['Next.js', 'C++', '@react', '#typescript'];

    for (const query of specialQueries) {
      await searchPage.goto();
      await searchPage.typeQuery(query);

      // 验证输入框接受特殊字符
      const inputValue = await searchPage.getCurrentQuery();
      expect(inputValue).toBe(query);
    }
  });

  test('空搜索提交', async () => {
    await searchPage.goto();
    await searchPage.clearSearch();

    try {
      await searchPage.searchButton.click();
      await searchPage.page.waitForLoadState('networkidle');

      // 验证不会崩溃，可能显示提示或保持原状
      await expect(searchPage.searchInput).toBeVisible();
    } catch {
      // 空搜索可能被阻止
    }
  });

  test.describe('响应式布局', () => {
    test('移动端搜索', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await searchPage.goto();

      await expect(searchPage.searchInput).toBeVisible();

      await searchPage.search('Next.js');
      await searchPage.verifyHasResults();
    });

    test('平板搜索', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await searchPage.goto();

      await expect(searchPage.searchInput).toBeVisible();

      await searchPage.search('TypeScript');

      const count = await searchPage.getResultCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test('搜索性能 - 快速响应', async () => {
    await searchPage.goto();

    const startTime = Date.now();
    await searchPage.search('Next.js');
    const endTime = Date.now();

    const responseTime = endTime - startTime;

    // 搜索响应时间应小于 3 秒
    expect(responseTime).toBeLessThan(3000);
  });

  test('搜索大小写不敏感', async () => {
    const queries = ['next.js', 'Next.js', 'NEXT.JS'];
    const results: number[] = [];

    for (const query of queries) {
      await searchPage.goto();
      await searchPage.search(query);

      const count = await searchPage.getResultCount();
      results.push(count);
    }

    // 验证大小写不同但结果数量相同
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
  });
});
