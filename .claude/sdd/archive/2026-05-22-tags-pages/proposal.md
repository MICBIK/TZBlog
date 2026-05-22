# Proposal — tags-pages

> Stage: Pre-deploy P2 cleanup
> Created: 2026-05-22
> Path: `.claude/sdd/tags-pages/`
> Tier: T2 / 0.5 day
> 视觉方向：Editorial（继承 hero-editorial 基线）

## Why

当前博客有 tag 数据（`Tag` model + `TagsOnPosts` join），post detail 渲染 tags，posts list 支持 `?tag=slug` filter。但缺：
1. `/tags` index 页 — 看到所有 tag + count
2. `/tags/[slug]` 详情页 — 该 tag 下所有 post（替代 `?tag=` query 形式，给 SEO + 分享更友好的 URL）

不修这层：tag 是死链。点 PostCard 上的 tag 会去到 `/posts?tag=foo`，URL ugly，且没有 tag landing context。

## What

### Capability: tags service
- 新建 `src/lib/services/tags-public.ts` (区别于现有 admin `tags.ts`)
- `listAllTagsWithCount(locale): Promise<TagWithCount[]>` — 所有 tag + 该 tag 下 PUBLISHED post count
- `getTagBySlug(slug): Promise<Tag | null>` — 单 tag
- 用 Prisma 现有 model；count 用 `_count: { select: { posts: { where: { post: { status: 'PUBLISHED' } } } } }`

### Capability: tags index page
- 新建 `src/app/(site)/tags/page.tsx`
- 渲染所有 tag，每个带 count，按 count 降序，链接到 `/tags/{slug}`
- Editorial cloud-like 排版（不是字号 cloud，是 Editorial 列表）

### Capability: tag detail page
- 新建 `src/app/(site)/tags/[slug]/page.tsx`
- 解 params.slug → getTagBySlug → 404 / 渲染
- 复用 `listPosts({ tag: slug, ... })` 现有 service
- 渲染 PostCard 列表 + pagination（参考 posts list 页）
- generateMetadata 含 tag 名

### Capability: tag link wiring
- 改 `PostCard.tsx` 中 tag link：从 `/posts?tag=...` 改为 `/tags/{slug}`
- 改 post detail 页内 tags 链接（如果有）

### 不在范围
- Tag CRUD admin（已存在）
- Tag color / icon
- Tag i18n（用 Tag.name；slug 通用）
- Tag follow / subscribe
- RSS per tag

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | tag link 形式 `/posts?tag=` vs `/tags/{slug}` | **`/tags/{slug}`** | SEO + 分享 + 可读 |
| R2 | 保留 `/posts?tag=` query | **保留**（不删 listPosts tag filter）| 已有 service 支持；不破坏 |
| R3 | tag count 包含 DRAFT post? | **只算 PUBLISHED** | 公开页面只显示发布数 |
| R4 | tags index 排序 | **count 降序，平局按 name** | 热门优先 |
| R5 | 单 tag 页 pagination | **复用 posts list page 的 pagination 模式** | 一致体验 |
| R6 | tag 不存在 → 404 | **notFound()** | Next.js 惯用 |
| R7 | tags-public.ts 还是放 tags.ts | **新文件 tags-public.ts** | 公开/admin 分离；admin tags.ts 已存在 |
| R8 | tag detail 页是否显示 count | **显示**（"3 posts"）| 给读者预期 |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| service | `specs/service/spec.md` | SPEC-TAG-V-1..4 |
| index | `specs/index/spec.md` | SPEC-TAG-I-1..3 |
| detail | `specs/detail/spec.md` | SPEC-TAG-D-1..5 |
| link-wire | `specs/link-wire/spec.md` | SPEC-TAG-L-1..2 |

## Impact

- 新增：
  - `src/lib/services/tags-public.ts` + `.test.ts`
  - `src/app/(site)/tags/page.tsx` + `.test.tsx`
  - `src/app/(site)/tags/[slug]/page.tsx` + `.test.tsx`
- 修改：
  - `src/components/site/PostCard.tsx`（tag link 改 `/tags/{slug}`）+ 同目录测试增 spec
- 依赖：无新装
- DB：无 schema 改动

## Workflow

1. SDD 9 件套（7 默认 + 2 个 specs 子目录的 4 文件）
2. **§A service**: 4 spec → 1 TDD pair（用 prisma mock 或 integration）
3. **§B index**: 3 spec → 1 TDD pair
4. **§C detail**: 5 spec → 1 TDD pair
5. **§D link-wire**: 2 spec → 1 TDD pair
6. 质量门 + completion-report

## Risks

| 风险 | 缓解 |
|------|------|
| `_count` with `where` filter 在 Prisma 版本兼容 | Prisma 5+ 支持 nested count where；项目 Prisma 5 fine（确认） |
| 改 PostCard tag link 破坏 existing test | spec-driven 改测试再改实现 |
| 同时有 `/posts?tag=` 和 `/tags/{slug}` 入口 duplicate content（SEO） | 加 canonical to `/tags/{slug}` on posts list when ?tag= present (next 增量；MVP 不强) |
| Tag 删除（admin）后旧链接 404 | acceptable，notFound() handle |
| 大量 tags 时 index 页长 | MVP 一次全列；count 降序自然把热门往上推 |
