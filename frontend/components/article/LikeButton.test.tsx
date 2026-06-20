import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { likeArticle, unlikeArticle } from '@/lib/api/like';

import { LikeButton } from './LikeButton';

vi.mock('@/lib/api/like', () => ({
  likeArticle: vi.fn(),
  unlikeArticle: vi.fn(),
}));

describe('LikeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('likes article and updates count from API', async () => {
    vi.mocked(likeArticle).mockResolvedValue({ liked: true, likeCount: 11 });

    render(<LikeButton articleId={1} initialCount={10} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(likeArticle).toHaveBeenCalledWith(1));
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  it('unlikes article and updates count from API', async () => {
    vi.mocked(unlikeArticle).mockResolvedValue({ liked: false, likeCount: 9 });

    render(<LikeButton articleId={1} initialCount={10} initialLiked />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(unlikeArticle).toHaveBeenCalledWith(1));
    expect(screen.getByText('9')).toBeInTheDocument();
  });
});
