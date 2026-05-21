# Active Context — TZBlog

> 当前正在做什么 / 下一步是什么。每次会话结束前应该是最新的。

## 当前焦点

**P1 收尾 + P2-D3 完结（评论审核页 + 评论区 + 点赞），P1 完整闭环。下一步：Analytics 上报 / Hero 重做 / archive 3 个 SDD**

- 媒体上传 §1-§7 已完成（archive `2026-05-21-media-upload`）。
- 文章后台（列表 + 筛选 + 编辑器）+ 外围测试齐全（170 → 213）。
- **2026-05-21** P2 前台 D1 完成：首页 `Recent Posts` 接 `listPosts` top 3、`Site Stats` 接 `getSiteStats` 真实计数、`PostCard` 与详情页 hero banner 渲染 `Post.cover`。**KI-002 闭环**。
- **2026-05-21** P2 前台 D2 完成：`extractToc` 复用 unified+rehypeSlug 管道，与 `renderMarkdown` 字面一致；`PostToc` 客户端组件用 IntersectionObserver 高亮 active；详情页 grid 布局 + `hidden lg:block` 右侧 sticky aside。
- **2026-05-21** P2 前台 E 完成：`sitemap.xml`、`robots.txt`、`rss.xml`、post OG image、root `metadataBase`、`SITE_META`，并完成 §F 审计 follow-up（KI-003 RESOLVED）。
- **2026-05-21** P2-D3 完成（评论区 + 点赞）：永久 unique 点赞、评论默认 PENDING、1 层 reply、rate-limit 5min/3、详情页接入 `<LikeButton>` + `<CommentSection>`。SDD `.claude/sdd/comments-and-likes/` 全程严格 TDD 微循环。
- **2026-05-21** P1 收尾完成（admin-comments-review）：schema 加 `reviewedBy`/`reviewedAt`（兼容 AI 审核 marker）；counter-fix 修正 D3 R5（commentCount 仅计 APPROVED）；admin /comments 4 tab + 多选 BulkActions + 行内动作；3 路由 + 5 endpoint；幂等 + cascade replies + 计数器累计。SDD `.claude/sdd/admin-comments-review/` 全程严格 TDD。
- 全套自动验证（pnpm typecheck / lint / test / build）全绿，基线 245 → 286 → 329（D3 +41 + C +43）。

## 下一步计划

1. **Analytics 客户端上报**（P2 收尾）：`<AnalyticsBeacon>` 接 `/api/track`，PageView 表入库；为 P4 后台仪表盘铺基础。
2. **3 个 SDD archive**：P2-E (seo-and-feed) + P2-D3 (comments-and-likes) + P1-C (admin-comments-review) manual smoke 后批量 archive。
3. **Hero / 营销页 design pass**：按 ECC design-quality 重做首页 Hero（editorial / bento / scrollytelling 方向待 ha1den 选）。
4. **CLAUDE.md 同步**：R6 / R9 决策落地后，CLAUDE.md "点赞 24h 滚动" 与 "commentCount 计 PENDING" 两行需同步改为"永久 unique"与"仅计 APPROVED"。

## 待办池 / 已知问题

- KI-001：登录表单 zodResolver 拒 `.local` TLD，见 `memory-bank/knownIssues.md`。

## 关键决策（已锁定）

| 决策 | 选择 |
|---|---|
| 应用形态 | 单体 Next.js |
| 框架 | Next.js 16 (App Router) |
| DB / ORM | Postgres 16 + Prisma 7（driver adapter @prisma/adapter-pg）|
| UI | shadcn/ui + Tailwind v4 + CSS 变量 |
| 编辑器 | Tiptap WYSIWYG + Markdown 序列化 |
| 认证 | Auth.js v5 split-config（Edge-safe + Full）|
| 媒体 | local / MinIO S3 driver |
| 部署 | VPS + Docker Compose + Caddy |
| 分析 | 自研（无第三方）|
| 评论 | 匿名 + 后台审核 |
| i18n | schema 预留 *Translation 子表 |

## 注意事项 / 偏离记录

- **Prisma 7 driver adapter 模式**：schema.prisma 内不再写 datasource.url；运行期 `src/lib/db.ts` 用 `@prisma/adapter-pg`；migrate/introspect 走 `prisma.config.ts` 的 datasource.url（dotenv 主动加载）。
- **Next.js 16 中间件 deprecation**：构建会报 `middleware.ts` deprecated → 应改名 `proxy.ts`，但功能正常工作。
- **Tiptap markdown pipeline 简化**：`MarkdownEditorWithPreview` 客户端预览用了 mini-renderer（待 V2 接 marked + DOMPurify 完整化），完整 remark+shiki 已落到服务端 `MarkdownPreview`。
- **rehype-shiki 替换**：原计划的 `rehype-shiki@0.0.9` 与 shiki@4 不兼容，改成内联 transformer 调用 `createHighlighter` + `codeToHast`。

## 待用户决策（不阻塞 P1）

- VPS 实际购买（推荐 Hetzner CX22，部署阶段前定）
- 域名（部署前定）

## 阻塞项

无。
