/**
 * 文章相关领域类型定义
 * 字段对齐后端实测响应（camelCase）。
 */

/** 作者/用户摘要 */
export interface Author {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
}

export interface ArticleAuthor extends Partial<Author> {
  email?: string;
  avatar?: string;
}

/** 标签 */
export interface Tag {
  id: number;
  name: string;
  slug: string;
}

/** 分类 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

/** 文章状态 */
export type ArticleStatus = 'draft' | 'published' | 'archived';

/** 文章列表项（对齐后端 GET /articles 响应） */
export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
  authorId: number;
  categoryId: number;
  status: ArticleStatus;
  isPremium: boolean;
  readingTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleDetail extends ArticleSummary {
  author?: ArticleAuthor;
  category?: Category;
  tags?: Tag[];
}

/** 文章列表响应（含分页 metadata） */
export interface ArticleListResult {
  items: ArticleSummary[];
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/** 创建/更新文章请求体（对齐后端 CreateArticleDTO） */
export interface UpsertArticleRequest {
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  coverImage?: string;
  categoryId: number;
  tags?: string[];
  isPremium?: boolean;
  status: ArticleStatus;
}

/** 文章列表查询参数 */
export interface ArticleListParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  status?: ArticleStatus;
  search?: string;
  /** latest | popular | trending */
  sort?: string;
}

/** 点赞结果 */
export interface ArticleLikeResult {
  liked: boolean;
  likeCount: number;
}
