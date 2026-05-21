## Why

> 追溯性补齐 — 本 SDD 在 commit `b083b57..4c89f10`（6 提交，3 微循环对）落地后审计阶段补写，目的是给 commit message 中引用的 `SPEC-E-1..7` 找到契约源头。CLAUDE.md TDD 执行铁律 #2 要求 tasks.md 生成前必须已有 test-map.md；此前实现绕过了该环节，本文是合规闭环。

P1 后台 CMS + P2-D 文章详情链路已完结，TZBlog 进入 P2-E "被看见" 阶段（见 `memory-bank/projectBrief.md` §1 / `activeContext.md` §17）：通过 SEO 元数据、订阅 feed、可分享的 OG 卡片让作者的内容触达陌生读者。

Next 15 App Router 提供的三个文件约定（`app/sitemap.ts` / `app/robots.ts` / `app/(site)/posts/[slug]/opengraph-image.tsx`）+ 一个 Route Handler (`app/rss.xml/route.ts`) 是最小落地路径，本 change 把这四块拼齐，复用现有 `listPosts` / `listColumns` / `getPostBySlug` service，不动 Prisma schema、不动 i18n 数据形态。

## What Changes

- **新增 `src/lib/site-meta.ts`**：导出 `SITE_META`（name / description / author / baseUrl）+ `absoluteUrl(path)` helper；统一 sitemap / rss / og 的站点级常量与 URL 拼接。`SITE_META.baseUrl` 取自 `env.SITE_URL`，强制经 zod 校验。
- **新增 `src/app/sitemap.ts`**（`MetadataRoute.Sitemap`）：包含静态路由（`/`、`/posts`、`/about`）+ 全部 `PUBLISHED` post（`updatedAt` 作 `lastModified`）+ 全部 column；DRAFT / ARCHIVED post 被严格排除。
- **新增 `src/app/rss.xml/route.ts`**：RSS 2.0 channel + 最多 20 条最新 PUBLISHED post 作为 `<item>`；`Content-Type: application/rss+xml; charset=utf-8`；内置 XML 实体转义（`& < > " '`）。
- **新增 `src/app/(site)/posts/[slug]/opengraph-image.tsx`**：1200×630 image/png，包含 `TZBLOG` brand mark / 文章标题（3 行 line-clamp）/ column label / 作者名。post missing 或非 PUBLISHED 时走 `notFound()`。
- **占位 `src/app/robots.ts`**（H3 follow-up，尚未实现）：声明 sitemap 入口的 Next 15 约定文件，本轮先 SDD 留存 spec，实现走 follow-up。

### Non-goals（防范围蔓延）

- 多 locale 的 sitemap / RSS 分流（MVP 仅 zh，V3 再说）
- sitemap index（文章超 50k 才需要分片）
- RSS Atom 1.0 / JSON Feed 镜像
- 列表页 / column 页的 OG 图（仅文章详情）
- og-image 模板可配置化（先固定深色模板，后期需求驱动再抽）
- 站点 manifest.json / favicon 套件（独立 change）
- 结构化数据 JSON-LD（独立 change，需 Schema.org 设计）
- Twitter Card 元数据（Next 15 OG 图天然带 twitter:image，足够 MVP）

## Capabilities

### New Capabilities

- `sitemap`：`/sitemap.xml` 路由的行为契约 — 含静态路由、PUBLISHED post lastModified、column slug；DRAFT / ARCHIVED 排除语义
- `feed`：`/rss.xml` 的 RSS 2.0 结构契约 — channel 三件套、cap 20、`publishedAt desc`、XML 转义安全
- `og-and-metadata`：post `opengraph-image.tsx` 文件约定的渲染契约 — 1200×630 png、状态守卫、column fallback
- `robots`（**PLANNED — 见 H3 follow-up**）：`/robots.txt` 的 user-agent 规则 + sitemap 引用

### Modified Capabilities

- 无（不动现有 Post / Column / Tag schema 或 API）

## Impact

### Prisma 模型
- **无 schema 变更**。复用 `Post.status` / `Post.publishedAt` / `Post.updatedAt` / `PostTranslation.{title,excerpt}` / `Column.slug` / `ColumnTranslation.name`。

### 路由
- 新增：`/sitemap.xml`（Next 15 MetadataRoute）、`GET /rss.xml`、`/posts/<slug>/opengraph-image`（自动挂到 post 详情 OG meta）
- 占位（follow-up）：`/robots.txt`
- 修改：无

### 组件
- 无 React UI 组件（OG 图是 ImageResponse JSX，但运行在 Edge / Node ImageResponse runtime，不复用站点组件）

### lib
- 新增：`src/lib/site-meta.ts`
- 复用：`src/lib/services/posts.ts`（`listPosts` / `getPostBySlug`）、`src/lib/services/columns.ts`（`listColumns`）、`src/lib/i18n.ts`（`DEFAULT_LOCALE`）
- 待清理：`src/lib/seo/` 空目录（创建但未使用 — L4，follow-up 删除或填充）

### 配置 / 部署
- 复用现有 `SITE_URL` env（已在 `src/lib/env.ts:17` 定义为 `z.string().url()`），本 change 不新增 env vars

### 审计 follow-up（合并前应处理）

> 本 change 实现已 PASS（typecheck/lint/test 全绿），但审计发现以下 4 个 HIGH/MEDIUM 缺口；记录在此并由 §F follow-up 任务跟踪。

- **H2**：`sitemap.ts:10` 写 `pageSize: 1000` 绕过 `postFilterSchema.pageSize.max(100)` zod 限制；文章超 1000 时静默截断
- **H3**：`src/app/robots.ts` 缺失（本 SDD 已留 spec 占位）
- **H4**：`app/layout.tsx` 缺 `metadataBase`，OG 元数据相对 URL 拼接不可靠
- **M1**：`opengraph-image.tsx:9` Props 类型 union 是兼容 shim — Next 15 标准只有 Promise
- **M2**：sitemap 用 `listColumns()` 未按 locale 过滤，可能列出无 zh 翻译的 column
- **M3**：rss/sitemap 缺 `revalidate` 缓存策略
- **M4**：RSS 缺 `<atom:link rel="self">` + `<lastBuildDate>`

### 参考设计（OG 图视觉方向）
- 深色背景 + 大号品牌 typography，参考 Vercel 默认 OG 图模板
- 不放头像 / 不放复杂渐变 / 不放图片背景（保持 build 时间可控、字体一致性）
- 文章标题 3 行 line-clamp，超出走 webkit-line-clamp 截断（非省略号）
