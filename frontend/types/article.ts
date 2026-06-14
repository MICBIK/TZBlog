/**
 * 文章相关领域类型定义
 * 字段对齐 docs/superpowers/specs/api-design.md 中文章接口的响应。
 */

/** 作者/用户摘要（列表与详情通用） */
export interface Author {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
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
}

/** 文章状态 */
export type ArticleStatus = 'draft' | 'published' | 'archived';

/** 文章列表项（精简字段） */
export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverImage: string;
  author: Pick<Author, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  tags: string[];
  viewCount: number;
  likeCount: number;
  isPremium: boolean;
  publishedAt: string;
}

/** 文章详情（完整字段） */
export interface ArticleDetail extends Omit<ArticleSummary, 'tags'> {
  content: string;
  author: Author;
  tags: Tag[];
  category: Category;
  commentCount: number;
  relatedArticles: Array<{
    id: number;
    title: string;
    slug: string;
    coverImage: string;
  }>;
  updatedAt: string;
}

/** 创建/更新文章请求体 */
export interface UpsertArticleRequest {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  categoryId: number;
  tags: string[];
  isPremium: boolean;
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
