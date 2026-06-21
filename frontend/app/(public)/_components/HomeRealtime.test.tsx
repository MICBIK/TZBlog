import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getArticles } from '@/lib/api/article';
import { getCategories } from '@/lib/api/category';
import { getComments } from '@/lib/api/comment';
import { getTags } from '@/lib/api/tag';

import { HomeRealtime } from './HomeRealtime';

vi.mock('@/lib/api/article', () => ({ getArticles: vi.fn() }));
vi.mock('@/lib/api/category', () => ({ getCategories: vi.fn() }));
vi.mock('@/lib/api/comment', () => ({ getComments: vi.fn() }));
vi.mock('@/lib/api/tag', () => ({ getTags: vi.fn() }));

describe('HomeRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getArticles).mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Pinned',
          slug: 'pinned',
          summary: 'Pinned summary',
          coverImage: '',
          authorId: 1,
          categoryId: 1,
          status: 'published',
          isPremium: false,
          readingTime: 12,
          viewCount: 101,
          likeCount: 12,
          commentCount: 3,
          publishedAt: '2026-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          title: 'Recent',
          slug: 'recent',
          summary: 'Recent summary',
          coverImage: '',
          authorId: 1,
          categoryId: 1,
          status: 'published',
          isPremium: false,
          readingTime: 8,
          viewCount: 55,
          likeCount: 6,
          commentCount: 1,
          publishedAt: '2026-01-02T00:00:00Z',
          createdAt: '2026-01-02T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
        },
      ],
      metadata: { total: 2 },
    });
    vi.mocked(getCategories).mockResolvedValue([{ id: 1, name: 'Frontend', slug: 'frontend' }]);
    vi.mocked(getTags).mockResolvedValue([{ id: 1, name: 'React', slug: 'react' }]);
    vi.mocked(getComments).mockResolvedValue({
      items: [{ id: 1, articleId: 1, userId: 2, content: 'Nice', status: 'published', createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z' }],
      metadata: { total: 1 },
    });
  });

  it('renders pinned article and recent articles from real APIs', async () => {
    render(<HomeRealtime />);

    await waitFor(() => expect(screen.getByRole('link', { name: 'read' })).toBeInTheDocument());
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('已发布文章')).toBeInTheDocument();
    expect(screen.getByText(/tail comments\.log/i).parentElement).toHaveTextContent('Nice');
  });
});
