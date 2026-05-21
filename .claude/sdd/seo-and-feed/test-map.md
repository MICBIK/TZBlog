# test-map.md — seo-and-feed

> 把每条 spec scenario 映射到测试函数 + 文件路径 + 层级。
> 这是 CLAUDE.md §6 TDD 执行铁律的强制环节：tasks.md 生成前 MUST 已有此文件。
> 本文是**追溯性补齐**（实现已 PASS），用于让 commit message 中的 `SPEC-E-1..7` 对应到真实测试函数。

## 测试层级约定

- **unit**：纯函数 / mock 数据 / 不打真实 DB / 不打文件系统
- **integration**：service / Metadata Route + 真实 Postgres（`tests/helpers/db.ts` 提供 `resetAll` / `ensureTestUser`）
- **e2e**：浏览器全链路 — **MVP 不写**，OG 图靠 manual smoke + 第三方 OG 预览工具（Twitter Card Validator / OpenGraph.xyz）验收

## 文件清单

| 测试文件 | 层级 | 覆盖范围 |
|---|---|---|
| `src/lib/site-meta.test.ts` | unit | `absoluteUrl` URL 拼接、trailing/leading slash normalize |
| `src/app/sitemap.test.ts` | integration | sitemap default export 全流程（真实 DB + 真实 listPosts / listColumns） |
| `src/app/rss.xml/route.test.ts` | unit | RSS XML 结构、cap 20、XML 实体转义（mock listPosts） |
| `src/app/(site)/posts/[slug]/opengraph-image.test.ts` | unit | OG 图 ImageResponse 返回值、notFound 守卫（mock getPostBySlug + notFound） |

> 注：OG 图视觉内容（背景色 / 字号 / 排版）不写自动化测试 — 走 manual smoke + 浏览器预览。文件约定（`size` / `contentType` exports）由 Next 15 框架本身保障，仅在 spec 文档化。

## 映射表

### Capability: sitemap

#### Requirement: sitemap 含静态路由 + 已发布文章 + 全部 column [SPEC-E-1]

| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 包含静态路由 + 已发布文章 + 全部 column 的 URL | `includes static routes + published posts + columns` | `src/app/sitemap.test.ts` | integration |
| 文章条目的 lastModified 等于 updatedAt | （同上测试函数末尾断言 `firstPostEntry?.lastModified === firstPost.updatedAt`） | `src/app/sitemap.test.ts` | integration |

#### Requirement: sitemap 排除 DRAFT 和 ARCHIVED 文章 [SPEC-E-2]

| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| DRAFT / ARCHIVED post 不出现 | `skips DRAFT and ARCHIVED posts` | `src/app/sitemap.test.ts` | integration |

### Capability: feed

#### Requirement: RSS feed 返回 application/rss+xml 含 channel + items [SPEC-E-3]

| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| RSS XML 结构与字段映射 | `returns application/rss+xml with channel + items` | `src/app/rss.xml/route.test.ts` | unit (mock listPosts) |

#### Requirement: RSS feed 最多 20 条，publishedAt 降序 [SPEC-E-4]

| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 25 条文章中只取最新 20 条 | `caps items at 20 in publishedAt desc` | `src/app/rss.xml/route.test.ts` | unit (mock listPosts) |

#### Requirement: RSS feed 转义 XML 安全字符 [SPEC-E-5]

| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 转义 5 类预定义实体 | `escapes &, <, >, ", and ' in title and description` | `src/app/rss.xml/route.test.ts` | unit (mock listPosts) |

### Capability: og-and-metadata

#### Requirement: post OG 图返回 1200×630 image/png 给已发布文章 [SPEC-E-6]

| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| PUBLISHED post 返回 image/png 200 | `returns image/png response for published post` | `src/app/(site)/posts/[slug]/opengraph-image.test.ts` | unit (mock getPostBySlug) |

#### Requirement: post OG 图对 missing / DRAFT / ARCHIVED 返回 notFound [SPEC-E-7]

| Scenario | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| 缺失 / 非 PUBLISHED 触发 notFound | `calls notFound when post missing or not published` | `src/app/(site)/posts/[slug]/opengraph-image.test.ts` | unit (mock getPostBySlug + notFound) |

### Capability: robots（PLANNED — 未实现）

#### Requirement: robots.txt 允许全部 user-agent 抓取站点 [SPEC-E-R-1]
#### Requirement: robots.txt 引用 sitemap [SPEC-E-R-2]

> 整个 capability 尚未实现。落地时新增 `src/app/robots.test.ts` 单测，覆盖：
> - `robots() returns rules with userAgent="*" and allow="/"`
> - `robots() sitemap field uses absoluteUrl("/sitemap.xml")`
>
> 实测形态参考 Next 15 docs：`pnpm test src/app/robots.test.ts`。
> 测试需 mock `@/lib/env`（env.SITE_URL）以验证 absolute URL 拼接。

## Zod schema 测试条目

本 change **无新增 zod schema**（复用 `postFilterSchema` 现有定义）。

H2 follow-up 涉及在 service 层新增 `listAllPublishedSlugs()` helper 或扩 `postFilterSchema` `pageSize.max(...)` —— 若选后者需在 `src/lib/schemas/post.test.ts` 补 schema 边界测试。

## RED 阶段环境依赖

| 测试 | 依赖 | 启动命令 |
|---|---|---|
| unit (`site-meta`、`rss.xml/route`、`opengraph-image`) | 无 | `pnpm test src/lib/site-meta.test.ts src/app/rss.xml src/app/\(site\)/posts/\[slug\]/opengraph-image.test.ts` |
| integration (`sitemap`) | 真实 Postgres | `pnpm docker:dev` + `pnpm db:migrate` + `pnpm test src/app/sitemap.test.ts` |

实测：本轮 RED 阶段 Postgres 已启动，无 `[RED-补证]` 挂起。

## 验收补充测试（审计 follow-up）

| Spec-ID | Test Layer | Test File | Test Function | Notes |
|---------|-----------|-----------|---------------|-------|
| — (M1) | unit | `src/app/(site)/posts/[slug]/opengraph-image.test.ts` | 改 mock `params` 为 `Promise<{ slug }>` | 修复 Props 类型 union shim 后必须连带改测试 |
| — (M2) | integration | `src/app/sitemap.test.ts` | 新增 `excludes columns without DEFAULT_LOCALE translation` | 切到 `listColumnsForLocale(DEFAULT_LOCALE)` 后补这条断言 |
| — (M4) | unit | `src/app/rss.xml/route.test.ts` | 新增 `includes <atom:link rel="self"> and <lastBuildDate>` | RSS 增强后补 |
| — (H2) | unit | `src/lib/schemas/post.test.ts` 或 `src/lib/services/posts.test.ts` | 视 H2 修复方案选 schema 边界或新 helper 单测 | sitemap 完整分页必须有测试守护 |
| — (H3) | unit | `src/app/robots.test.ts` | 见上方 robots capability 段 | 新文件 |
