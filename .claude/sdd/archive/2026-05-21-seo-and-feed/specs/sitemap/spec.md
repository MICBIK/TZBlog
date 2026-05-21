## ADDED Requirements

> Spec IDs: **SPEC-E-1**, **SPEC-E-2**
>
> Implementation: `src/app/sitemap.ts` (Next 15 `MetadataRoute.Sitemap`)
> Tests: `src/app/sitemap.test.ts`（integration，真实 Postgres + `tests/helpers/db.ts`）

### Requirement: sitemap 含静态路由 + 已发布文章 + 全部 column [SPEC-E-1]

`/sitemap.xml` SHALL 是 Next 15 `MetadataRoute.Sitemap` 导出的 default async function，返回的数组 MUST 包含：

1. 三条静态路由：`absoluteUrl("/")`、`absoluteUrl("/posts")`、`absoluteUrl("/about")`
2. 所有 `status === "PUBLISHED"` 的 post，URL 为 `absoluteUrl("/posts/<slug>")`，`lastModified` 字段等于 `post.updatedAt`
3. 所有 column，URL 为 `absoluteUrl("/columns/<slug>")`

URL 必须全部以 `SITE_META.baseUrl`（取自 `env.SITE_URL`）为前缀，由 `absoluteUrl()` 统一拼接（自动 normalize trailing/leading slash）。

#### Scenario: 包含静态路由 + 已发布文章 + 全部 column 的 URL
- **GIVEN** 数据库已建立 3 个 PUBLISHED post（slug = `published-one` / `published-two` / `published-three`）+ 2 个 column（slug = `tech` / `notes`）
- **WHEN** 调用 sitemap default export
- **THEN** 返回的 entries `.url` 集合包含 `${baseUrl}/`、`${baseUrl}/posts`、`${baseUrl}/about`、`${baseUrl}/posts/published-one`、`${baseUrl}/posts/published-two`、`${baseUrl}/posts/published-three`、`${baseUrl}/columns/tech`、`${baseUrl}/columns/notes`
- **AND** 所有 URL 都以 `baseUrl` 开头（`url.startsWith(baseUrl) === true`）

#### Scenario: 文章条目的 lastModified 等于 updatedAt
- **GIVEN** 一个 PUBLISHED post 的 `updatedAt = 2026-05-21T00:00:00Z`
- **WHEN** sitemap 生成
- **THEN** 对应条目的 `lastModified === post.updatedAt`（同 Date 实例或同 ISO 字符串）

### Requirement: sitemap 排除 DRAFT 和 ARCHIVED 文章 [SPEC-E-2]

sitemap 中 `/posts/<slug>` 形式的 URL MUST 仅来自 `status === "PUBLISHED"` 的 post。DRAFT 与 ARCHIVED 状态的 post slug 不允许出现。

#### Scenario: DRAFT / ARCHIVED post 不出现在 sitemap
- **GIVEN** 数据库有 `live-only` (PUBLISHED) / `draft-post` (DRAFT) / `archived-post` (ARCHIVED) 三个 post
- **WHEN** sitemap 生成
- **THEN** entries 中所有 `${baseUrl}/posts/` 开头的 URL 仅为 `[${baseUrl}/posts/live-only]`
- **AND** 不含 `${baseUrl}/posts/draft-post`、不含 `${baseUrl}/posts/archived-post`

## Open Issues

- **H2 (审计 follow-up)**：当前实现 `listPosts({ pageSize: 1000, status: "PUBLISHED" })` 绕过 `postFilterSchema.pageSize.max(100)`；文章数 > 1000 时静默截断。修复方案见 `tasks.md §F.1`。
- **M2 (审计 follow-up)**：当前实现 `listColumns()` 未按 locale 过滤，可能列出无 `DEFAULT_LOCALE` 翻译的 column（这些 column 在前台 `/columns/<slug>` 会 404）。修复方案见 `tasks.md §F.2`。
- **L3 (审计 follow-up)**：本 spec 未约束 `priority` / `changeFrequency`，目前实现也未输出；可选 SEO 增强。
