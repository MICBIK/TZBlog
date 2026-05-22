# Active Context — TZBlog

> 当前正在做什么 / 下一步是什么。每次会话结束前应该是最新的。

## 当前焦点

**public-launch-polish 正在收尾：Markdown 阅读系统、首页/关于页展示、admin light mode 对比度已完成；当前正在更新 i18n/V2/V3 文档债并准备最终质量门与浏览器逐页审查。**

- 媒体上传 §1-§7 已完成（archive `2026-05-21-media-upload`）。
- 文章后台（列表 + 筛选 + 编辑器）+ 外围测试齐全（170 → 213）。
- **2026-05-21** P2 前台 D1 完成：首页 `Recent Posts` 接 `listPosts` top 3、`Site Stats` 接 `getSiteStats` 真实计数、`PostCard` 与详情页 hero banner 渲染 `Post.cover`。**KI-002 闭环**。
- **2026-05-21** P2 前台 D2 完成：`extractToc` 复用 unified+rehypeSlug 管道，与 `renderMarkdown` 字面一致；`PostToc` 客户端组件用 IntersectionObserver 高亮 active；详情页 grid 布局 + `hidden lg:block` 右侧 sticky aside。
- **2026-05-21** P2 前台 E 完成：`sitemap.xml`、`robots.txt`、`rss.xml`、post OG image、root `metadataBase`、`SITE_META`，并完成 §F 审计 follow-up（KI-003 RESOLVED）。
- **2026-05-21** P2-D3 完成（评论区 + 点赞）：永久 unique 点赞、评论默认 PENDING、1 层 reply、rate-limit 5min/3、详情页接入 `<LikeButton>` + `<CommentSection>`。SDD `.claude/sdd/comments-and-likes/` 全程严格 TDD 微循环。
- **2026-05-21** P1 收尾完成（admin-comments-review）：schema 加 `reviewedBy`/`reviewedAt`（兼容 AI 审核 marker）；counter-fix 修正 D3 R5（commentCount 仅计 APPROVED）；admin /comments 4 tab + 多选 BulkActions + 行内动作；3 路由 + 5 endpoint；幂等 + cascade replies + 计数器累计。
- **2026-05-21** P2 收尾完成（analytics-beacon）：trackPayloadSchema + recordPageView + POST /api/track（DNT 守 + 黑名单 + rate-limit 60/min）+ <AnalyticsBeacon> client + SiteLayout 接入；4 决策（R10/R11/R12/R14）全部选 A（推荐）。SDD `.claude/sdd/analytics-beacon/` 全程严格 TDD。
- **2026-05-22** 4 SDD 归档后 manual smoke 复验全通过（含 1 个工具偏离 — admin 删除评论 confirm 改 API 旁路验证）。
- **2026-05-22** P1-C 后置 UX patch：shadcn AlertDialog 替换评论删除原生确认框，解除 in-app browser 限制；测试 352 → 354（+2 net）；commits `c466f52 → 593be7f`。
- **2026-05-23** prelaunch-readiness：`src/proxy.ts` 替代旧入口、Prisma 7 preview flag 清理、About/TechStack 上线文案修正、README/AGENTS/CLAUDE/docs/memory-bank 当前事实同步完成。
- **2026-05-23** public-launch-polish：Markdown GitHub-style alerts + `.markdown-body` 阅读系统、首页 LaunchNarrative、About Principles、launch-surface 背景/面板 primitives、admin sidebar/header light mode 对比度修复已落地。
- **2026-05-23** i18n 限制明确记录为 KI-004：当前实现仍是单 locale，V3 独立 SDD 才做 Next.js App Router locale routing、dictionary、metadata / RSS / sitemap 全链路迁移。
- **2026-05-23** 最终质量门通过：`pnpm typecheck` ✓、`pnpm lint` ✓、`pnpm test` ✓（85 files / 460 passed / 1 skipped）、`pnpm build` ✓。旧 Next middleware / Prisma preview warning 已消失；测试仍有已记录的 `pg@9` deprecation warning。

## 下一步计划

1. **本轮收尾**：跑 `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build`，然后用 in-app Browser 审查 `/`、`/about`、`/posts`、`/admin`、`/admin/posts/new`。
2. **P3 部署上线**：补 `Dockerfile`、生产 smoke、备份脚本、VPS/域名配置、灰度上线。
3. **V2 backlog**：主题 GUI、详细 Analytics、评论邮件通知、编辑器增强、真实示例内容和 OG 视觉统一，分别独立 SDD。
4. **V3 backlog**：Next.js App Router locale routing（`app/[lang]`）、dictionary、Header 切换器、英文内容与多语言 SEO/RSS/sitemap，独立 SDD。

## 待办池 / 已知问题

- KI-001：登录表单 zodResolver 拒 `.local` TLD，见 `memory-bank/knownIssues.md`。

## 关键决策（已锁定）

| 决策 | 选择 |
|---|---|
| 应用形态 | 单体 Next.js |
| 框架 | Next.js 16 (App Router) |
| DB / ORM | Postgres 16 + Prisma 7（driver adapter @prisma/adapter-pg）|
| UI | shadcn/ui + Tailwind v4 + CSS 变量 |
| 编辑器 | Markdown source editor + split preview，存储 Markdown |
| 认证 | Auth.js v5 split-config（Edge-safe + Full）|
| 媒体 | local / MinIO S3 driver |
| 部署 | VPS + Docker Compose + Caddy |
| 分析 | 自研（无第三方）|
| 评论 | 匿名 + 后台审核 |
| i18n | schema 预留 *Translation 子表 |

## 注意事项 / 偏离记录

- **Prisma 7 driver adapter 模式**：schema.prisma 内不再写 datasource.url；运行期 `src/lib/db.ts` 用 `@prisma/adapter-pg`；migrate/introspect 走 `prisma.config.ts` 的 datasource.url（dotenv 主动加载）。
- **Next.js 16 request guard**：当前使用 `src/proxy.ts` 守 `/admin/*` 与 `/api/admin/*`。
- **Markdown preview pipeline 简化**：`MarkdownEditorWithPreview` 客户端预览用了 mini-renderer（待 V2 接 marked + DOMPurify 完整化），完整 remark+shiki 已落到服务端 `MarkdownPreview`。
- **rehype-shiki 替换**：原计划的 `rehype-shiki@0.0.9` 与 shiki@4 不兼容，改成内联 transformer 调用 `createHighlighter` + `codeToHast`。
- **i18n 当前状态**：当前实现仍是单 locale；`SUPPORTED_LOCALES` 只代表数据模型预留，不代表站点已支持多语言。

## 待用户决策（不阻塞 P1）

- VPS 实际购买（推荐 Hetzner CX22，部署阶段前定）
- 域名（部署前定）

## 阻塞项

无。
