# tasks.md — tags-pages

> 阶段前缀 `[TAG]`
> commit scopes: `tags-service` / `tags-index` / `tags-detail` / `tags-link`

## §0 准备

- [ ] 读 SDD 全套 + master / handoff-guide / design-system / known-findings
- [ ] inspect:
  - `prisma/schema.prisma` Tag + TagsOnPosts (no i18n)
  - `src/lib/services/posts.ts` (listPosts 已支持 tag filter)
  - `src/lib/services/tags.ts` (admin tags service，看 pattern；不复用)
  - `src/components/site/PostCard.tsx` (现 tag link 形式)
  - `src/app/(site)/posts/[slug]/page.tsx` (是否渲染 tags)

## §A [TAG] service (SPEC-TAG-V-1..4)

### A.1 [TEST-RED]
- 新建 `src/lib/services/tags-public.test.ts`
- 4 spec，按测试策略 mock prisma 或用 test DB
- 跑 → FAIL
- commit: `test(tags-service): SPEC-TAG-V-1..4 listAllTagsWithCount + getTagBySlug`

### A.1 [IMPL-GREEN]
- 新建 `src/lib/services/tags-public.ts`：
  - `listAllTagsWithCount(locale)` 用 `_count.where: { post.status: PUBLISHED }`
  - `getTagBySlug(slug)`
  - 显式注释 "locale reserved for future i18n"
- 跑 → PASS
- commit: `feat(tags-service): SPEC-TAG-V-1..4 public tags service with published-only count`

## §B [TAG] index page (SPEC-TAG-I-1..3)

### B.1 [TEST-RED]
- 新建 `src/app/(site)/tags/page.test.tsx`
- 跑 → FAIL
- commit: `test(tags-index): SPEC-TAG-I-1..3 /tags page render + empty + metadata`

### B.1 [IMPL-GREEN]
- 新建 `src/app/(site)/tags/page.tsx`（Editorial styled，per design-notes）
- 跑 → PASS
- commit: `feat(tags-index): SPEC-TAG-I-1..3 /tags index page with Editorial cloud layout`

## §C [TAG] detail page (SPEC-TAG-D-1..5)

### C.1 [TEST-RED]
- 新建 `src/app/(site)/tags/[slug]/page.test.tsx`
- 5 spec
- 跑 → FAIL
- commit: `test(tags-detail): SPEC-TAG-D-1..5 /tags/[slug] detail + 404 + pagination + metadata + empty`

### C.1 [IMPL-GREEN]
- 新建 `src/app/(site)/tags/[slug]/page.tsx`：
  - generateMetadata
  - notFound() on missing tag
  - reuse listPosts({ tag: slug, status: PUBLISHED, ... })
  - reuse PostCard component
  - pagination 复用 posts list 模式（直接抄）
- 跑 → PASS
- commit: `feat(tags-detail): SPEC-TAG-D-1..5 /tags/[slug] page with pagination`

## §D [TAG] link wire (SPEC-TAG-L-1..2)

### D.1 [TEST-RED]
- 扩 `src/components/site/PostCard.test.tsx` 加 SPEC-TAG-L-1
- 若 post detail 有 tag link → 加 SPEC-TAG-L-2
- 跑 → FAIL（原 link 仍是 ?tag=）
- commit: `test(tags-link): SPEC-TAG-L-1..2 PostCard + detail tag links use /tags/{slug}`

### D.1 [IMPL-GREEN]
- 改 `src/components/site/PostCard.tsx`：tag link href 从 `/posts?tag=${slug}` 改 `/tags/${slug}`
- 若 post detail 渲染 tags → 同样改
- 跑 → PASS, full pnpm test
- commit: `feat(tags-link): SPEC-TAG-L-1..2 wire tag chips to /tags/{slug}`

## §E 验收

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] dev server smoke：
  - 访问 /tags 看 tag list
  - 点 tag 跳 /tags/{slug}
  - 看到 post 列表
  - 翻页
  - 访问 /tags/不存在 → 404
- [ ] `grep -r "posts?tag=" src/` 仅在 admin / query UI 文件出现
- [ ] completion-report.md

## §F 不归档
