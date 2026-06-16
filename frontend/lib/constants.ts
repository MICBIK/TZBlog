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
  SEARCH: '/search',
  PATHWAYS: '/pathways',
  WORKS: '/works',
  LIBRARY: '/library',
  LANDING: '/landing',
  ACCOUNT: '/account',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
} as const;

/**
 * 前台主导航 — 单一数据源（single source of truth）。
 * 对照原型 front-home.html topbar（第 206-213 行）与 site-chrome.js FOOTER 导航列。
 * Header 用 `label`（终端英文），Footer 用 `zh`（中文文案）；`path` 是命令行提示符路径。
 */
export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly zh: string;
  readonly path: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { href: '/', label: 'home', zh: '首页', path: '~' },
  { href: '/pathways', label: 'pathways', zh: '学习路径', path: '~/pathways' },
  { href: '/works', label: 'works', zh: '作品', path: '~/works' },
  { href: '/library', label: 'shelf', zh: '归档书架', path: '~/shelf' },
  { href: '/search', label: 'search', zh: '搜索', path: '~/search' },
  { href: '/about', label: 'about', zh: '关于', path: '~/about' },
] as const;
