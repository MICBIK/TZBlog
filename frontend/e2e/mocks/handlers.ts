import { Page, Route } from '@playwright/test';
import articles from '../fixtures/articles.json';
import users from '../fixtures/users.json';

/**
 * API Mock Handlers for E2E Tests
 * 拦截并模拟后端 API 响应
 */

export interface MockAPIOptions {
  page: Page;
  baseURL?: string;
}

export class MockAPI {
  private page: Page;
  private baseURL: string;

  constructor({ page, baseURL = 'http://localhost:8080/api/v1' }: MockAPIOptions) {
    this.page = page;
    this.baseURL = baseURL;
  }

  /**
   * 设置所有 API mocks
   */
  async setupAll() {
    await this.mockArticlesList();
    await this.mockArticleDetail();
    await this.mockSearch();
    await this.mockAuth();
    await this.mockCategories();
    await this.mockTags();
  }

  /**
   * Mock 文章列表 API
   */
  async mockArticlesList() {
    await this.page.route('**/api/v1/articles*', async (route: Route) => {
      const url = new URL(route.request().url());
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedArticles = articles.slice(start, end);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: paginatedArticles,
          metadata: {
            total: articles.length,
            page,
            limit,
            totalPages: Math.ceil(articles.length / limit),
          },
        }),
      });
    });
  }

  /**
   * Mock 文章详情 API
   */
  async mockArticleDetail() {
    await this.page.route('**/api/v1/articles/*', async (route: Route) => {
      const url = route.request().url();
      const slug = url.split('/').pop()?.split('?')[0];

      const article = articles.find(a => a.slug === slug || a.id === slug);

      if (article) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: article,
          }),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'ARTICLE_NOT_FOUND',
              message: 'Article not found',
            },
          }),
        });
      }
    });
  }

  /**
   * Mock 搜索 API
   */
  async mockSearch() {
    await this.page.route('**/api/v1/search*', async (route: Route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q') || '';

      const results = articles.filter(article =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(query.toLowerCase())
      );

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: results,
          metadata: {
            total: results.length,
            query,
          },
        }),
      });
    });
  }

  /**
   * Mock 认证 API
   */
  async mockAuth() {
    // Mock 登录
    await this.page.route('**/api/v1/auth/login', async (route: Route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.email === 'test@example.com' && postData.password === 'password123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock_jwt_token_123456789',
              user: users[1],
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          }),
        });
      }
    });

    // Mock 注册
    await this.page.route('**/api/v1/auth/register', async (route: Route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock_jwt_token_new_user',
            user: {
              id: '999',
              username: postData.username,
              email: postData.email,
              avatar: '/avatars/default.jpg',
              role: 'user',
            },
          },
        }),
      });
    });

    // Mock 登出
    await this.page.route('**/api/v1/auth/logout', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { message: 'Logged out successfully' },
        }),
      });
    });

    // Mock 获取当前用户
    await this.page.route('**/api/v1/auth/me', async (route: Route) => {
      const authHeader = route.request().headers()['authorization'];

      if (authHeader && authHeader.startsWith('Bearer ')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: users[1],
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Unauthorized',
            },
          }),
        });
      }
    });
  }

  /**
   * Mock 分类 API
   */
  async mockCategories() {
    await this.page.route('**/api/v1/categories*', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: '1', name: 'Frontend', slug: 'frontend', count: 2 },
            { id: '2', name: 'Testing', slug: 'testing', count: 1 },
          ],
        }),
      });
    });
  }

  /**
   * Mock 标签 API
   */
  async mockTags() {
    await this.page.route('**/api/v1/tags*', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: '1', name: 'Next.js', slug: 'nextjs', count: 1 },
            { id: '2', name: 'React', slug: 'react', count: 1 },
            { id: '3', name: 'TypeScript', slug: 'typescript', count: 1 },
            { id: '4', name: 'Testing', slug: 'testing', count: 1 },
            { id: '5', name: 'Playwright', slug: 'playwright', count: 1 },
          ],
        }),
      });
    });
  }
}
