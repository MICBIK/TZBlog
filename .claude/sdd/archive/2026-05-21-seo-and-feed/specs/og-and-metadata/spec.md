## ADDED Requirements

> Spec IDs: **SPEC-E-6**, **SPEC-E-7**
>
> Implementation: `src/app/(site)/posts/[slug]/opengraph-image.tsx`（Next 15 文件约定，自动挂到 post 详情页 `og:image`）
> Tests: `src/app/(site)/posts/[slug]/opengraph-image.test.ts`（unit，mock `getPostBySlug` 与 `next/navigation.notFound`）

### Requirement: post OG 图返回 1200×630 image/png 给已发布文章 [SPEC-E-6]

`opengraph-image.tsx` SHALL 导出：

1. `size = { width: 1200, height: 630 } as const`
2. `contentType = "image/png"`
3. `default` 函数 `async ({ params }): Promise<Response>` — 调用 `getPostBySlug(slug)` 取 post，调用 `next/og` 的 `ImageResponse` 渲染 JSX，返回 Response

JSX 内容 MUST 包含：
- `TZBLOG` 品牌标签
- 文章标题（取 `DEFAULT_LOCALE` 的 PostTranslation.title，缺失则取 `translations[0]`），3 行 line-clamp
- column 标签（取 `DEFAULT_LOCALE` 的 ColumnTranslation.name，缺失则 `translations[0].name`，再缺失退到 `column.slug`；post 无 column 时显示 `"Writings"`）
- 作者名（`SITE_META.author`）

#### Scenario: PUBLISHED post 返回 image/png 200
- **GIVEN** slug=`hello` 对应一条 PUBLISHED post（title=`Hello World`）
- **WHEN** 调用 `default({ params: { slug: "hello" } })`
- **THEN** `getPostBySlug` 被调用一次，参数为 `"hello"`
- **AND** 返回值是 `Response` 实例
- **AND** `response.status === 200`
- **AND** `response.headers.get("content-type")` 含 `image/png`

### Requirement: post OG 图对 missing / DRAFT / ARCHIVED 返回 notFound [SPEC-E-7]

post 不存在、或 `status !== "PUBLISHED"` 时 SHALL 调用 `next/navigation` 的 `notFound()`（其内部抛 `NEXT_NOT_FOUND` 控制流异常，由 Next 框架捕获渲染 404 页面）。

guard 顺序：
1. `if (!post || post.status !== "PUBLISHED") notFound()`
2. `if (!pickPostTranslation(post)) notFound()` — 防御性检查，post 无任何翻译时也走 404

#### Scenario: 缺失 / 非 PUBLISHED 触发 notFound
- **GIVEN** 三种输入：(a) `getPostBySlug` 返回 `null`、(b) DRAFT post、(c) ARCHIVED post
- **WHEN** 对每种输入调用 `default({ params: { slug: ... } })`
- **THEN** 每次调用都抛出 `NEXT_NOT_FOUND` 异常
- **AND** `notFound()` mock 各被调用 1 次

## Open Issues

- **M1 (审计 follow-up)**：当前 `Props.params` 类型为 `{ slug: string } | Promise<{ slug: string }>` union，是兼容性 shim。Next 15 标准只有 `Promise<...>`。修复方案见 `tasks.md §F.5`。
- **L2 (审计 follow-up)**：JSX 中三处颜色 hardcode `#0a0a0a / #ffffff / #888888`，应迁到 `SITE_META` 同源 token 或 `src/lib/seo/` 内统一管理。
- **测试质量补 (审计 follow-up)**：当前测试断言仅覆盖 200 + content-type，未验图像字节长度 / size export。可补 `expect(size).toEqual({ width: 1200, height: 630 })` 与 `expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000)`。
