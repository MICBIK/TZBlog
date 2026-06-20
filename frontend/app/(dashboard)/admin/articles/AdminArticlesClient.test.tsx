import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getArticles } from '@/lib/api/article';
import type { ArticleSummary } from '@/types/article';

import { AdminArticlesClient } from './AdminArticlesClient';

vi.mock('@/lib/api/article', () => ({ getArticles: vi.fn() }));
vi.mock('@/components/admin/DeleteArticleButton', () => ({
  DeleteArticleButton: () => <button type="button">delete</button>,
}));

function makeArticle(overrides: Partial<ArticleSummary>): ArticleSummary {
  return {
    id: 1,
    title: 'Draft article',
    slug: 'draft-article',
    summary: '',
    coverImage: '',
    authorId: 1,
    categoryId: 1,
    status: 'draft',
    isPremium: false,
    readingTime: 5,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    publishedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('AdminArticlesClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads admin article list on the client with the selected status filter', async () => {
    vi.mocked(getArticles).mockResolvedValue({
      items: [makeArticle({ id: 7, title: 'Draft from backend' })],
      metadata: { total: 1 },
    });

    render(<AdminArticlesClient initialStatus="draft" />);

    await screen.findByText('Draft from backend');

    expect(getArticles).toHaveBeenCalledWith({
      status: 'draft',
      limit: 50,
    });
    expect(screen.getByRole('link', { name: '草稿' })).toHaveClass(
      'text-primary',
    );
  });

  it('shows an explicit empty state instead of rendering fixture rows', async () => {
    vi.mocked(getArticles).mockResolvedValue({
      items: [],
      metadata: { total: 0 },
    });

    render(<AdminArticlesClient />);

    await waitFor(() => expect(getArticles).toHaveBeenCalled());
    expect(screen.getByText(/暂无文章/)).toBeInTheDocument();
  });
});
