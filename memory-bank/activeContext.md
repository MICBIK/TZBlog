# Active Context — TZBlog

> 当前正在做什么 / 下一步是什么。每次会话结束前应该是最新的。

## 当前焦点

**P2-E 已完结（RSS / sitemap / OG + §F 审计 follow-up），下一步 C 评论审核页 / D3 评论区 + 点赞**

- 媒体上传 §1-§7 已完成（archive `2026-05-21-media-upload`）。
- 文章后台（列表 + 筛选 + 编辑器）+ 外围测试齐全（170 → 213）。
- **2026-05-21** P2 前台 D1 完成：首页 `Recent Posts` 接 `listPosts` top 3、`Site Stats` 接 `getSiteStats` 真实计数、`PostCard` 与详情页 hero banner 渲染 `Post.cover`。**KI-002 闭环**。
- **2026-05-21** P2 前台 D2 完成：`extractToc` 复用 unified+rehypeSlug 管道，与 `renderMarkdown` 字面一致；`PostToc` 客户端组件用 IntersectionObserver 高亮 active；详情页 grid 布局 + `hidden lg:block` 右侧 sticky aside。
- **2026-05-21** P2 前台 E 完成：`sitemap.xml`、`robots.txt`、`rss.xml`、post OG image、root `metadataBase`、`SITE_META`，并完成 §F 审计 follow-up（KI-003 RESOLVED）。
- **2026-05-21** P2-E SDD 追溯补齐：先前实现绕过 CLAUDE.md TDD 铁律 #2，审计后补 `.claude/sdd/seo-and-feed/{proposal, specs/{sitemap,feed,og-and-metadata,robots}/spec, test-map, tasks}.md`，本轮 §F follow-up 已在同一 SDD 内闭环。
- 全套自动验证（pnpm typecheck / lint / test）全绿，基线 229 → 245，+16 specs。

## 下一步计划

1. **C. 评论审核页**（P1 收尾）：pending/approved/spam/rejected 标签 + 批量操作。需先 seed 少量评论。
2. **D3. 评论区 + 点赞**（P2 前台交互）：visitorHash 去重，匿名提交，5min/3 评论 rate limit。需动 schema 或复用现有 `Comment` 表。
3. **P2-E manual smoke / archive**：访问 `/sitemap.xml`、`/robots.txt`、`/rss.xml`、`/posts/<slug>/opengraph-image` 后再跑 verify/archive。

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
