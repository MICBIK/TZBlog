/**
 * 全局常量定义
 */

/** 后端 API 基础地址 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/** 站点地址（用于 SEO、OG、绝对链接） */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** 本地存储中保存 JWT Token 的键名 */
export const TOKEN_STORAGE_KEY = 'tzblog_token';

/** 请求超时时间（毫秒） */
export const API_TIMEOUT_MS = 10_000;

/** 分页默认值 */
export const DEFAULT_PAGE_SIZE = 20;

/** 标题/内容等字段长度上限 */
export const MAX_TITLE_LENGTH = 255;
export const MAX_SUMMARY_LENGTH = 500;

/** 路由路径常量 */
export const ROUTES = {
  HOME: '/',
  ARTICLES: '/articles',
  ABOUT: '/about',
  ARCHIVE: '/archive',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
} as const;
