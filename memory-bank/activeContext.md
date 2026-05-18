# Active Context — TZBlog

> 当前正在做什么 / 下一步是什么。每次会话结束前应该是最新的。

## 当前焦点

**P1 - 专栏 CRUD 已完成（2026-05-18）**：
- Domain：`schemas/column.ts` + `services/columns.ts` + 3 条 REST API（list/POST、[id] GET/PATCH/DELETE、reorder POST）
- Admin UI：`/admin/columns` 列表页 + ColumnFormDialog（受控 open/onOpenChange）+ ColumnReorderControls（上下移）+ ColumnRowActions（编辑/删除）
- Public UI：`/columns`（卡片列表）+ `/columns/[slug]`（详情含发布文章列表 + generateMetadata + notFound）
- Tests：60/61 ✓（1 skipped — listColumnsForLocale fallback 行为待定）
- 端到端验证：写入 2 条专栏 → /columns 列表渲染 ✓ / /columns/hello-world 详情 ✓ / /columns/non-existent 404 ✓

## 下一步计划

**P1 续 — 文章管理（建议下一个 feature）**：
按相同的 5-agent 切片模式，文章 CRUD 比专栏复杂在：
- 加入 Tiptap 编辑器（已有 MarkdownEditorWithPreview）
- 文章发布/草稿状态机
- 标签 (Tag + TagsOnPosts) 关联
- 文章列表的筛选（按专栏 / 状态 / 标签）+ 分页

切片建议：
- Agent A: schema + service + admin REST API
- Agent B: 文章列表页（Table + 筛选 + 分页）
- Agent C: 文章编辑器页（接入已有 MarkdownEditorWithPreview + 元数据侧栏）
- Agent D: tests
- Agent E: 公开页 `/posts/[slug]`（含 Shiki 渲染、TOC、浏览/点赞/评论占位）

## 关键决策（已锁定）

| 决策 | 选择 |
|---|---|
| 应用形态 | 单体 Next.js |
| 框架 | Next.js 16 (App Router) |
| DB / ORM | Postgres 16 + Prisma 7（driver adapter @prisma/adapter-pg）|
| UI | shadcn/ui + Tailwind v4 + CSS 变量 |
| 编辑器 | Tiptap WYSIWYG + Markdown 序列化 |
| 认证 | Auth.js v5 split-config（Edge-safe + Full）|
| 媒体 | MinIO |
| 部署 | VPS + Docker Compose + Caddy |
| 分析 | 自研（无第三方）|
| 评论 | 匿名 + 后台审核 |
| i18n | schema 预留 *Translation 子表 |

## 注意事项 / 偏离记录

- **Prisma 7 driver adapter 模式**：schema.prisma 内不再写 datasource.url；运行期 `src/lib/db.ts` 用 `@prisma/adapter-pg`；migrate/introspect 走 `prisma.config.ts` 的 datasource.url（dotenv 主动加载）
- **Next.js 16 中间件 deprecation**：构建会报 `middleware.ts` deprecated → 应改名 `proxy.ts`，但功能正常工作。计划在 P1 早期处理
- **Tiptap markdown pipeline 简化**：`MarkdownEditorWithPreview` 客户端预览用了 mini-renderer（待 V2 接 marked + DOMPurify 完整化），完整 remark+shiki 已落到服务端 `MarkdownPreview`
- **rehype-shiki 替换**：原计划的 `rehype-shiki@0.0.9` 与 shiki@4 不兼容，改成内联 transformer 调用 `createHighlighter` + `codeToHast`

## 待用户决策（不阻塞 P1）

- VPS 实际购买（推荐 Hetzner CX22，部署阶段前定）
- 域名（部署前定）

## 阻塞项

无。

