/**
 * Mock 数据层
 * 用于前端独立开发，后端未就绪的功能（如点赞 D2）走 mock。
 * 通过 NEXT_PUBLIC_USE_MOCK 控制。
 */

import type { ArticleSummary } from '@/types/article';
import type { Category } from '@/types/article';
import type { Tag } from '@/types/article';
import type { AuthSession } from '@/types/auth';
import type { LikeStatus } from '@/lib/api/like';

export const MOCK_USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

/** Mock 分类 */
export const mockCategories: Category[] = [
  { id: 1, name: '前端', slug: 'frontend' },
  { id: 2, name: '后端', slug: 'backend' },
  { id: 3, name: 'DevOps', slug: 'devops' },
  { id: 4, name: '随笔', slug: 'essay' },
];

/** Mock 标签 */
export const mockTags: Tag[] = [
  { id: 1, name: 'React', slug: 'react' },
  { id: 2, name: 'Next.js', slug: 'nextjs' },
  { id: 3, name: 'TypeScript', slug: 'typescript' },
  { id: 4, name: 'Go', slug: 'go' },
  { id: 5, name: 'Docker', slug: 'docker' },
];

/** Mock 文章列表 */
export const mockArticles: ArticleSummary[] = [
  {
    id: 1,
    title: 'Next.js 16 App Router 实战指南',
    slug: 'nextjs-16-app-router-guide',
    summary:
      '深入理解 Next.js 16 的 App Router 架构、服务端组件与数据获取模式。',
    coverImage: '',
    authorId: 1,
    categoryId: 1,
    status: 'published',
    isPremium: false,
    readingTime: 8,
    viewCount: 1234,
    likeCount: 56,
    commentCount: 8,
    publishedAt: '2026-06-10T10:00:00Z',
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 2,
    title: 'Go Gin 框架：构建高性能 REST API',
    slug: 'go-gin-rest-api',
    summary: '使用 Go Gin 框架构建高性能 RESTful API 的完整实践。',
    coverImage: '',
    authorId: 1,
    categoryId: 2,
    status: 'published',
    isPremium: false,
    readingTime: 12,
    viewCount: 892,
    likeCount: 43,
    commentCount: 5,
    publishedAt: '2026-06-08T14:00:00Z',
    createdAt: '2026-06-08T14:00:00Z',
    updatedAt: '2026-06-08T14:00:00Z',
  },
  {
    id: 3,
    title: 'Tailwind CSS v4：设计令牌驱动的样式系统',
    slug: 'tailwindcss-v4-design-tokens',
    summary: '探索 Tailwind CSS v4 的设计令牌系统与 @theme 指令。',
    coverImage: '',
    authorId: 1,
    categoryId: 1,
    status: 'published',
    isPremium: true,
    readingTime: 6,
    viewCount: 678,
    likeCount: 34,
    commentCount: 3,
    publishedAt: '2026-06-05T09:30:00Z',
    createdAt: '2026-06-05T09:30:00Z',
    updatedAt: '2026-06-05T09:30:00Z',
  },
];

/** Mock 登录响应 */
export const mockAuthSession: AuthSession = {
  user: {
    id: 1,
    username: 'testadmin',
    email: 'test@tzblog.dev',
    displayName: 'Test Admin',
    bio: 'TZBlog 测试管理员',
    avatarUrl: '',
    role: 'admin',
    status: 'active',
    isVerified: true,
    lastLoginAt: null,
    createdAt: '2026-06-14T10:00:00Z',
    updatedAt: '2026-06-14T10:00:00Z',
  },
  token: 'mock-jwt-token-for-development',
};

/** Mock 点赞状态 */
export const mockLikeStatus: LikeStatus = {
  liked: false,
  likeCount: 56,
};

/** 模拟网络延迟 */
export function mockDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
