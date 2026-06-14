import { apiDelete, apiGet, apiGetList, apiPost, apiPut } from '@/lib/api/client';
import type { ApiMetadata } from '@/types/api';
import type {
  ArticleDetail,
  ArticleLikeResult,
  ArticleListParams,
  ArticleSummary,
  UpsertArticleRequest,
} from '@/types/article';

/**
 * 文章相关 API。
 * 失败时抛出 ApiRequestError（含 status / code / message）。
 */

/** 获取文章列表（含分页元信息） */
export async function getArticles(
  params: ArticleListParams = {},
): Promise<{ items: ArticleSummary[]; metadata: ApiMetadata | undefined }> {
  return apiGetList<ArticleSummary>('/articles', { params });
}

/** 按 slug 获取文章详情 */
export async function getArticleBySlug(slug: string): Promise<ArticleDetail> {
  return apiGet<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`);
}

/** 创建文章 [需管理员权限] */
export async function createArticle(
  body: UpsertArticleRequest,
): Promise<{ id: number; slug: string; status: string }> {
  return apiPost<{ id: number; slug: string; status: string }>('/articles', body);
}

/** 更新文章 [需管理员权限] */
export async function updateArticle(
  id: number,
  body: UpsertArticleRequest,
): Promise<{ id: number; slug: string; status: string }> {
  return apiPut<{ id: number; slug: string; status: string }>(
    `/articles/${id}`,
    body,
  );
}

/** 删除文章 [需管理员权限] */
export async function deleteArticle(id: number): Promise<void> {
  await apiDelete(`/articles/${id}`);
}

/** 点赞 / 取消点赞文章 */
export async function toggleArticleLike(id: number): Promise<ArticleLikeResult> {
  return apiPost<ArticleLikeResult>(`/articles/${id}/like`);
}
