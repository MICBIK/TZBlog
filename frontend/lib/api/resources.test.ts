import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createArticle,
  getArticleById,
  deleteArticle,
  getArticleBySlug,
  getArticleCountByStatus,
  getArticles,
  updateArticle,
} from '@/lib/api/article';
import {
  changePassword,
  getCurrentUser,
  login,
  logout,
  register,
  updateProfile,
} from '@/lib/api/auth';
import {
  createCategory,
  getCategories,
  getCategoryById,
} from '@/lib/api/category';
import {
  createComment,
  getComments,
  getCommentsByArticle,
} from '@/lib/api/comment';
import { getLikeStatus, likeArticle, unlikeArticle } from '@/lib/api/like';
import { searchArticles } from '@/lib/api/search';
import { createTag, getTagById, getTags } from '@/lib/api/tag';
import { getUploadConfig, uploadImage } from '@/lib/api/upload';

import * as client from './client';

vi.mock('./client', () => ({
  apiGet: vi.fn(),
  apiGetList: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

describe('resource APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates auth APIs to client helpers', async () => {
    const session = { user: { id: 1 }, token: 'token' };
    vi.mocked(client.apiPost)
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(undefined);
    vi.mocked(client.apiGet).mockResolvedValueOnce({ id: 1, username: 'u' });
    vi.mocked(client.apiPut)
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(undefined);

    await expect(
      login({ email: 'a@b.com', password: 'secret123' }),
    ).resolves.toBe(session);
    await expect(
      register({ username: 'u', email: 'a@b.com', password: 'secret123' }),
    ).resolves.toBe(session);
    await expect(getCurrentUser()).resolves.toEqual({ id: 1, username: 'u' });
    await expect(logout()).resolves.toBeUndefined();
    await expect(updateProfile({ displayName: 'New' })).resolves.toEqual({
      id: 1,
    });
    await expect(
      changePassword({ currentPassword: 'old', newPassword: 'new-password' }),
    ).resolves.toBeUndefined();

    expect(client.apiPost).toHaveBeenNthCalledWith(1, '/auth/login', {
      email: 'a@b.com',
      password: 'secret123',
    });
    expect(client.apiPost).toHaveBeenNthCalledWith(2, '/auth/register', {
      username: 'u',
      email: 'a@b.com',
      password: 'secret123',
    });
    expect(client.apiGet).toHaveBeenCalledWith('/auth/me');
    expect(client.apiPost).toHaveBeenNthCalledWith(3, '/auth/logout');
    expect(client.apiPut).toHaveBeenNthCalledWith(1, '/auth/profile', {
      displayName: 'New',
    });
    expect(client.apiPut).toHaveBeenNthCalledWith(2, '/auth/password', {
      currentPassword: 'old',
      newPassword: 'new-password',
    });
  });

  it('delegates article APIs and unwraps list metadata', async () => {
    vi.mocked(client.apiGetList)
      .mockResolvedValueOnce({
        items: [{ id: 1, title: 'A' }],
        metadata: { total: 2, page: 1, limit: 10 },
      })
      .mockResolvedValueOnce({
        items: [],
        metadata: { total: 7 },
      });
    vi.mocked(client.apiGet).mockResolvedValueOnce({
      id: 1,
      slug: 'hello-world',
    });
    vi.mocked(client.apiGet).mockResolvedValueOnce({
      id: 2,
      slug: 'by-id-article',
    });
    vi.mocked(client.apiPost).mockResolvedValueOnce({ id: 2 });
    vi.mocked(client.apiPut).mockResolvedValueOnce({ id: 2, title: 'Updated' });
    vi.mocked(client.apiDelete).mockResolvedValueOnce(undefined);

    await expect(getArticles({ page: 1, tag: 'go' })).resolves.toEqual({
      items: [{ id: 1, title: 'A' }],
      metadata: { total: 2, page: 1, limit: 10 },
    });
    await expect(getArticleBySlug('hello world')).resolves.toEqual({
      id: 1,
      slug: 'hello-world',
    });
    await expect(getArticleById(2)).resolves.toEqual({
      id: 2,
      slug: 'by-id-article',
    });
    await expect(
      createArticle({
        title: 'New',
        content: 'Body',
        categoryId: 1,
        status: 'draft',
      }),
    ).resolves.toEqual({ id: 2 });
    await expect(updateArticle(2, { title: 'Updated' })).resolves.toEqual({
      id: 2,
      title: 'Updated',
    });
    await expect(deleteArticle(2)).resolves.toBeUndefined();
    await expect(getArticleCountByStatus('published')).resolves.toBe(7);

    expect(client.apiGetList).toHaveBeenNthCalledWith(1, '/articles', {
      params: { page: 1, tag: 'go' },
    });
    expect(client.apiGet).toHaveBeenCalledWith('/articles/hello%20world');
    expect(client.apiGet).toHaveBeenCalledWith('/articles/by-id/2');
    expect(client.apiPost).toHaveBeenCalledWith('/articles', {
      title: 'New',
      content: 'Body',
      categoryId: 1,
      status: 'draft',
    });
    expect(client.apiPut).toHaveBeenCalledWith('/articles/by-id/2', {
      title: 'Updated',
    });
    expect(client.apiDelete).toHaveBeenCalledWith('/articles/by-id/2');
    expect(client.apiGetList).toHaveBeenNthCalledWith(2, '/articles', {
      params: { status: 'published', limit: 1 },
    });
  });

  it('delegates category, tag, like and upload APIs', async () => {
    vi.mocked(client.apiGet)
      .mockResolvedValueOnce([{ id: 1, name: 'Tech' }])
      .mockResolvedValueOnce({ id: 1, slug: 'tech' })
      .mockResolvedValueOnce([{ id: 2, name: 'Go' }])
      .mockResolvedValueOnce({ id: 2, slug: 'go' })
      .mockResolvedValueOnce({ liked: true, count: 10 })
      .mockResolvedValueOnce({
        allowedExtensions: ['png'],
        allowedTypes: ['image/png'],
        maxSize: 1024,
        storage: 'r2',
      });
    vi.mocked(client.apiPost)
      .mockResolvedValueOnce({ id: 1, slug: 'tech' })
      .mockResolvedValueOnce({ id: 2, slug: 'go' })
      .mockResolvedValueOnce({ liked: true, count: 10 })
      .mockResolvedValueOnce({ filename: 'a.png', url: '/a.png', size: 12 });
    vi.mocked(client.apiDelete).mockResolvedValueOnce({
      liked: false,
      count: 9,
    });

    await expect(getCategories()).resolves.toEqual([{ id: 1, name: 'Tech' }]);
    await expect(getCategoryById(1)).resolves.toEqual({ id: 1, slug: 'tech' });
    await expect(
      createCategory({ name: 'Tech', slug: 'tech' }),
    ).resolves.toEqual({
      id: 1,
      slug: 'tech',
    });
    await expect(getTags()).resolves.toEqual([{ id: 2, name: 'Go' }]);
    await expect(getTagById(2)).resolves.toEqual({ id: 2, slug: 'go' });
    await expect(createTag({ name: 'Go', slug: 'go' })).resolves.toEqual({
      id: 2,
      slug: 'go',
    });
    await expect(likeArticle(3)).resolves.toEqual({
      liked: true,
      likeCount: 10,
    });
    await expect(unlikeArticle(3)).resolves.toEqual({
      liked: false,
      likeCount: 9,
    });
    await expect(getLikeStatus(3)).resolves.toEqual({
      liked: true,
      likeCount: 10,
    });
    await expect(getUploadConfig()).resolves.toEqual({
      allowedExtensions: ['png'],
      allowedTypes: ['image/png'],
      maxSize: 1024,
      storage: 'r2',
    });

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const uploadResult = await uploadImage(file);
    expect(uploadResult).toEqual({
      filename: 'a.png',
      url: '/a.png',
      size: 12,
    });
    expect(client.apiPost).toHaveBeenLastCalledWith(
      '/uploads/images',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  });

  it('delegates comment APIs', async () => {
    vi.mocked(client.apiGetList).mockResolvedValueOnce({
      items: [{ id: 11, userId: 7, content: 'recent' }],
      metadata: { total: 4, page: 1, limit: 3 },
    });
    vi.mocked(client.apiGetList).mockResolvedValueOnce({
      items: [{ id: 1, articleId: 3, content: 'hello' }],
      metadata: { total: 1, page: 1, limit: 20 },
    });
    vi.mocked(client.apiPost).mockResolvedValueOnce({
      id: 2,
      articleId: 3,
      content: 'created',
    });

    await expect(getComments({ page: 1, limit: 3 })).resolves.toEqual({
      items: [{ id: 11, userId: 7, content: 'recent' }],
      metadata: { total: 4, page: 1, limit: 3 },
    });
    await expect(
      getCommentsByArticle(3, { page: 1, limit: 20 }),
    ).resolves.toEqual({
      items: [{ id: 1, articleId: 3, content: 'hello' }],
      metadata: { total: 1, page: 1, limit: 20 },
    });
    await expect(
      createComment({ articleId: 3, content: 'created', parentId: 9 }),
    ).resolves.toEqual({
      id: 2,
      articleId: 3,
      content: 'created',
    });

    expect(client.apiGetList).toHaveBeenNthCalledWith(1, '/comments', {
      params: { page: 1, limit: 3 },
    });
    expect(client.apiGetList).toHaveBeenNthCalledWith(2, '/comments', {
      params: { article_id: 3, page: 1, limit: 20 },
    });
    expect(client.apiPost).toHaveBeenCalledWith('/comments', {
      article_id: 3,
      content: 'created',
      parent_id: 9,
    });
  });

  it('delegates search API to /search and normalizes hits', async () => {
    vi.mocked(client.apiGet).mockResolvedValueOnce({
      hits: [
        {
          id: '1',
          slug: 'spec-first-workflow',
          title: 'Spec First',
          summary: 'summary',
          publishedAt: 1710000000000,
          viewCount: 9,
          readingTime: 12,
          likeCount: 3,
        },
      ],
      estimatedTotalHits: 1,
      query: 'spec',
      limit: 20,
      offset: 0,
      processingTimeMs: 1,
    });

    await expect(
      searchArticles({ q: 'spec', category: 'ai-coding' }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 1,
          slug: 'spec-first-workflow',
          title: 'Spec First',
          summary: 'summary',
          viewCount: 9,
          readingTime: 12,
          likeCount: 3,
        }),
      ],
      total: 1,
    });

    expect(client.apiGet).toHaveBeenCalledWith('/search', {
      params: { q: 'spec', category: 'ai-coding' },
    });
  });
});
