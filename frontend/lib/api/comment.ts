import { apiGetList, apiPost } from '@/lib/api/client';

export interface CommentItem {
  id: number;
  articleId: number;
  userId: number;
  parentId?: number | null;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentListResult {
  items: CommentItem[];
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface CreateCommentRequest {
  articleId: number;
  content: string;
  parentId?: number;
}

interface CreateCommentPayload {
  article_id: number;
  content: string;
  parent_id?: number;
}

export interface CommentListParams {
  articleId?: number;
  userId?: number;
  page?: number;
  limit?: number;
}

export async function getComments(
  params: CommentListParams = {},
): Promise<CommentListResult> {
  const { articleId, userId, ...rest } = params;
  const { items, metadata } = await apiGetList<CommentItem>('/comments', {
    params: {
      ...(articleId ? { article_id: articleId } : {}),
      ...(userId ? { user_id: userId } : {}),
      ...rest,
    },
  });

  return { items, metadata };
}

export async function getCommentsByArticle(
  articleId: number,
  params: { page?: number; limit?: number } = {},
): Promise<CommentListResult> {
  return getComments({ articleId, ...params });
}

export async function createComment(
  body: CreateCommentRequest,
): Promise<CommentItem> {
  const payload: CreateCommentPayload = {
    article_id: body.articleId,
    content: body.content,
    ...(body.parentId ? { parent_id: body.parentId } : {}),
  };

  return apiPost<CommentItem>('/comments', payload);
}
