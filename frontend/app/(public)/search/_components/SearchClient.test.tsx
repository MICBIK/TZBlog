import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getArticles } from '@/lib/api/article';
import { getCategories } from '@/lib/api/category';
import type { ArticleSummary } from '@/types/article';

import { SearchClient } from './SearchClient';

vi.mock('@/lib/api/article', () => ({ getArticles: vi.fn() }));
vi.mock('@/lib/api/category', () => ({ getCategories: vi.fn() }));

const mockGetArticles = vi.mocked(getArticles);
const mockGetCategories = vi.mocked(getCategories);

function makeArticle(over: Partial<ArticleSummary>): ArticleSummary {
  return {
    id: 1,
    title: 'title',
    slug: 'slug',
    content: '',
    summary: '',
    coverImage: '',
    authorId: 1,
    categoryId: 1,
    status: 'published',
    isPremium: false,
    readingTime: 5,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    publishedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

describe('SearchClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue([]);
  });

  it('每条搜索结果链接到各自真实 slug（不再全部指向同一篇）', async () => {
    mockGetArticles.mockResolvedValue({
      items: [
        makeArticle({ id: 1, title: 'RSC 缓存的坑', slug: 'rsc-cache-7-traps' }),
        makeArticle({ id: 2, title: 'Go 重写后端', slug: 'go-rewrite-p99' }),
      ],
      metadata: { total: 2 },
    });

    render(<SearchClient />);

    const first = await screen.findByRole('link', { name: /RSC 缓存的坑/ });
    const second = await screen.findByRole('link', { name: /Go 重写后端/ });

    expect(first.getAttribute('href')).toBe('/articles/rsc-cache-7-traps');
    expect(second.getAttribute('href')).toBe('/articles/go-rewrite-p99');
    // 关键回归：两条结果 href 必须不同，杜绝原型里所有命中共用一个 HIT_HREF
    expect(first.getAttribute('href')).not.toBe(second.getAttribute('href'));
  });

  it('从后端文章接口取数，而非内置静态数据', async () => {
    mockGetArticles.mockResolvedValue({ items: [], metadata: { total: 0 } });

    render(<SearchClient />);

    await waitFor(() => expect(mockGetArticles).toHaveBeenCalled());
  });
});
