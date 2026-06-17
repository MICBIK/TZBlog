import {
  apiDelete,
  apiGet,
  apiGetList,
  apiPost,
  apiPut,
} from '@/lib/api/client';
import type {
  ArticleDetail,
  ArticleListParams,
  ArticleListResult,
  ArticleStatus,
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
): Promise<ArticleListResult> {
  const { items, metadata } = await apiGetList<ArticleSummary>('/articles', {
    params,
  });
  return { items, metadata };
}

/** 获取文章详情（按 slug） */
export async function getArticleBySlug(slug: string): Promise<ArticleDetail> {
  return apiGet<ArticleDetail>(`/articles/slug/${encodeURIComponent(slug)}`);
}

/** 创建文章 [需管理员] */
export async function createArticle(
  body: UpsertArticleRequest,
): Promise<ArticleSummary> {
  return apiPost<ArticleSummary>('/articles', body);
}

/** 更新文章 [需管理员] */
export async function updateArticle(
  id: number,
  body: Partial<UpsertArticleRequest>,
): Promise<ArticleSummary> {
  return apiPut<ArticleSummary>(`/articles/by-id/${id}`, body);
}

/** 删除文章 [需管理员] */
export async function deleteArticle(id: number): Promise<void> {
  await apiDelete(`/articles/by-id/${id}`);
}

/** 按状态筛选文章数（用于后台统计） */
export async function getArticleCountByStatus(
  status: ArticleStatus,
): Promise<number> {
  const { metadata } = await apiGetList<ArticleSummary>('/articles', {
    params: { status, limit: 1 },
  });
  return metadata?.total ?? 0;
}
