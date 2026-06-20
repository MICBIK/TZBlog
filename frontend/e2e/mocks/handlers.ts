import { Page, Route } from '@playwright/test';
import articles from '../fixtures/articles.json';

/**
 * API Mock Handlers for E2E Tests
 * 拦截并模拟后端 API 响应
 */

export interface MockAPIOptions {
  page: Page;
  baseURL?: string;
}

function buildAuthUser(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 1,
    username: 'haiden',
    email: 'test@example.com',
    displayName: 'haiden',
    bio: 'E2E admin user',
    avatarUrl: '/avatars/admin.jpg',
    role: 'admin',
    status: 'active',
    isVerified: true,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
    ...overrides,
  };
}

function normalizeArticleDetail(article: Record<string, unknown>) {
  return {
    ...article,
    summary:
      (article.summary as string | undefined) ??
      (article.excerpt as string | undefined) ??
      '',
  };
}

export class MockAPI {
  private page: Page;
  private baseURL: string;

  constructor({
    page,
    baseURL = 'http://localhost:8080/api/v1',
  }: MockAPIOptions) {
    this.page = page;
    this.baseURL = baseURL;
  }

  /**
   * 设置所有 API mocks
   */
  async setupAll() {
    await this.mockArticleDetail();
    await this.mockArticlesList();
    await this.mockSearch();
    await this.mockAuth();
    await this.mockCategories();
    await this.mockTags();
    await this.mockComments();
    await this.mockLikes();
  }

  /**
   * Mock 文章列表 API
   */
  async mockArticlesList() {
    await this.page.route(
      /\/api\/v1\/articles(\?.*)?$/,
      async (route: Route) => {
        const url = new URL(route.request().url());
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = (url.searchParams.get('search') || '').toLowerCase();
        const category = url.searchParams.get('category');
        const tag = url.searchParams.get('tag');

        const filtered = articles.filter((article) => {
          const matchesSearch =
            !search ||
            article.title.toLowerCase().includes(search) ||
            article.excerpt.toLowerCase().includes(search) ||
            article.content.toLowerCase().includes(search);
          const matchesCategory =
            !category || article.category?.slug === category;
          const matchesTag =
            !tag || article.tags?.some((item) => item.slug === tag);
          return matchesSearch && matchesCategory && matchesTag;
        });

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedArticles = filtered.slice(start, end);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: paginatedArticles,
            metadata: {
              total: filtered.length,
              page,
              limit,
              totalPages: Math.ceil(filtered.length / limit) || 1,
            },
          }),
        });
      },
    );
  }

  /**
   * Mock 文章详情 API
   */
  async mockArticleDetail() {
    await this.page.route('**/api/v1/articles/*', async (route: Route) => {
      const url = route.request().url();
      const slug = url.split('/').pop()?.split('?')[0];

      const article = articles.find((a) => a.slug === slug || a.id === slug);

      if (article) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: normalizeArticleDetail(article as Record<string, unknown>),
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
      const category = url.searchParams.get('category');
      const tag = url.searchParams.get('tag');

      const results = articles.filter((article) => {
        const matchesQuery =
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(query.toLowerCase()) ||
          article.content.toLowerCase().includes(query.toLowerCase());
        const matchesCategory =
          !category || article.category?.slug === category;
        const matchesTag =
          !tag || article.tags?.some((item) => item.slug === tag);
        return matchesQuery && matchesCategory && matchesTag;
      });

      const hits = results.map((article) => ({
        id: String(article.id),
        slug: article.slug,
        title: article.title,
        summary: article.excerpt,
        publishedAt: article.publishedAt
          ? new Date(article.publishedAt).getTime()
          : 0,
        viewCount: article.viewCount,
        readingTime: article.readingTime,
        likeCount: article.likeCount,
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            hits,
            estimatedTotalHits: results.length,
            query,
            limit: 20,
            offset: 0,
            processingTimeMs: 1,
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

      if (
        postData.email === 'test@example.com' &&
        postData.password === 'password123'
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock_jwt_token_123456789',
              user: buildAuthUser({
                email: postData.email,
                username: 'testuser',
                displayName: 'testuser',
              }),
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
            user: buildAuthUser({
              id: 999,
              username: postData.username,
              email: postData.email,
              displayName: postData.displayName || postData.username,
            }),
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
            data: buildAuthUser(),
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
            { id: 1, name: 'AI Coding', slug: 'ai-coding', count: 1 },
            { id: 2, name: 'Frontend', slug: 'frontend', count: 2 },
            { id: 3, name: 'Testing', slug: 'testing', count: 1 },
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

  async mockComments() {
    await this.page.route('**/api/v1/comments*', async (route: Route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 999,
              articleId: payload.article_id,
              userId: 1,
              content: payload.content,
              status: 'published',
              createdAt: '2026-06-19T00:00:00Z',
              updatedAt: '2026-06-19T00:00:00Z',
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 101,
              articleId: 1,
              userId: 2,
              content: 'spec 那段直接照搬到我们 CI 里了。',
              status: 'published',
              createdAt: '2026-06-17T00:00:00Z',
              updatedAt: '2026-06-17T00:00:00Z',
            },
          ],
          metadata: {
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        }),
      });
    });
  }

  async mockLikes() {
    await this.page.route(
      '**/api/v1/likes/articles/*',
      async (route: Route) => {
        const method = route.request().method();
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { liked: false, count: 12 },
            }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              liked: method === 'POST',
              count: method === 'POST' ? 13 : 12,
            },
          }),
        });
      },
    );
  }
}
