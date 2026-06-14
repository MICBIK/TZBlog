import { apiDelete, apiGet, apiPost } from '@/lib/api/client';

/** 点赞状态 */
export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}

/**
 * 点赞相关 API。
 * 后端路由为 /likes/articles/:id（多态设计）。
 * 注意：后端 likes 表 schema 仍在修复中（D2），前端先用真实路径调用，
 * 失败时由调用方降级为本地乐观更新。
 */

/** 点赞文章 */
export async function likeArticle(articleId: number): Promise<LikeStatus> {
  return apiPost<LikeStatus>(`/likes/articles/${articleId}`);
}

/** 取消点赞 */
export async function unlikeArticle(articleId: number): Promise<LikeStatus> {
  return apiDelete<LikeStatus>(`/likes/articles/${articleId}`);
}

/** 查询点赞状态 */
export async function getLikeStatus(articleId: number): Promise<LikeStatus> {
  return apiGet<LikeStatus>(`/likes/articles/${articleId}/status`);
}
