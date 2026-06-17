import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createArticle,
  deleteArticle,
  getArticleBySlug,
  getArticleCountByStatus,
  getArticles,
  updateArticle,
} from '@/lib/api/article';
import { changePassword, getCurrentUser, login, logout, register, updateProfile } from '@/lib/api/auth';
import { createCategory, getCategories, getCategoryById } from '@/lib/api/category';
import { getLikeStatus, likeArticle, unlikeArticle } from '@/lib/api/like';
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
    vi.mocked(client.apiPost).mockResolvedValueOnce(session).mockResolvedValueOnce(session).mockResolvedValueOnce(undefined);
    vi.mocked(client.apiGet).mockResolvedValueOnce({ id: 1, username: 'u' });
    vi.mocked(client.apiPut).mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(undefined);

    await expect(login({ email: 'a@b.com', password: 'secret123' })).resolves.toBe(session);
    await expect(register({ username: 'u', email: 'a@b.com', password: 'secret123' })).resolves.toBe(session);
    await expect(getCurrentUser()).resolves.toEqual({ id: 1, username: 'u' });
    await expect(logout()).resolves.toBeUndefined();
    await expect(updateProfile({ displayName: 'New' })).resolves.toEqual({ id: 1 });
    await expect(changePassword({ currentPassword: 'old', newPassword: 'new-password' })).resolves.toBeUndefined();

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
    expect(client.apiPut).toHaveBeenNthCalledWith(1, '/auth/profile', { displayName: 'New' });
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
    vi.mocked(client.apiGet).mockResolvedValueOnce({ id: 1, slug: 'hello-world' });
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
    expect(client.apiGet).toHaveBeenCalledWith('/articles/slug/hello%20world');
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
      .mockResolvedValueOnce({ allowedExtensions: ['png'], allowedTypes: ['image/png'], maxSize: 1024, storage: 'r2' });
    vi.mocked(client.apiPost)
      .mockResolvedValueOnce({ id: 1, slug: 'tech' })
      .mockResolvedValueOnce({ id: 2, slug: 'go' })
      .mockResolvedValueOnce({ liked: true, count: 10 })
      .mockResolvedValueOnce({ filename: 'a.png', url: '/a.png', size: 12 });
    vi.mocked(client.apiDelete).mockResolvedValueOnce({ liked: false, count: 9 });

    await expect(getCategories()).resolves.toEqual([{ id: 1, name: 'Tech' }]);
    await expect(getCategoryById(1)).resolves.toEqual({ id: 1, slug: 'tech' });
    await expect(createCategory({ name: 'Tech', slug: 'tech' })).resolves.toEqual({
      id: 1,
      slug: 'tech',
    });
    await expect(getTags()).resolves.toEqual([{ id: 2, name: 'Go' }]);
    await expect(getTagById(2)).resolves.toEqual({ id: 2, slug: 'go' });
    await expect(createTag({ name: 'Go', slug: 'go' })).resolves.toEqual({
      id: 2,
      slug: 'go',
    });
    await expect(likeArticle(3)).resolves.toEqual({ liked: true, likeCount: 10 });
    await expect(unlikeArticle(3)).resolves.toEqual({ liked: false, likeCount: 9 });
    await expect(getLikeStatus(3)).resolves.toEqual({ liked: true, likeCount: 10 });
    await expect(getUploadConfig()).resolves.toEqual({
      allowedExtensions: ['png'],
      allowedTypes: ['image/png'],
      maxSize: 1024,
      storage: 'r2',
    });

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const uploadResult = await uploadImage(file);
    expect(uploadResult).toEqual({ filename: 'a.png', url: '/a.png', size: 12 });
    expect(client.apiPost).toHaveBeenLastCalledWith(
      '/uploads/images',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  });
});
