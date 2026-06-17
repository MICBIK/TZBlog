import { test, expect } from '@playwright/test';

test.describe('错误页面测试', () => {
  test('404 页面渲染真实恢复屏', async ({ page }) => {
    await page.goto('/non-existent-page-12345');

    await expect(page.locator('main').getByText('404', { exact: true })).toBeVisible();
    await expect(
      page.getByText('zsh: no such file or directory — 你要找的页面走失了。'),
    ).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('404 页面会回显请求路径', async ({ page }) => {
    await page.goto('/non-existent-page-12345');

    await expect(page.getByText('/non-existent-page-12345')).toBeVisible();
  });

  test('from 参数优先于 pathname 被回显', async ({ page }) => {
    await page.goto('/missing?from=%2Farticles%2Fghost-post');

    await expect(page.getByText('/articles/ghost-post')).toBeVisible();
  });

  test('恢复命令可返回首页', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.getByRole('link', { name: 'cd ~/home' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.locator('h1').first()).toContainText('spec-first 工作流');
  });

  test('404 顶栏导航仍可用', async ({ page }) => {
    await page.goto('/non-existent-page-12345');

    const nav = page.locator('header nav');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: './home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: './search' })).toBeVisible();
    await expect(nav.getByRole('link', { name: './archive' })).toBeVisible();
    await expect(nav.getByRole('link', { name: './about' })).toBeVisible();
  });

  test('移动端 404 页面仍保留主操作', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/non-existent-page-12345');

    await expect(page.getByRole('link', { name: 'cd ~/home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'grep 全站搜索' })).toBeVisible();
  });
});
