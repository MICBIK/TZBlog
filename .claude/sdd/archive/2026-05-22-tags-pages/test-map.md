# test-map.md — tags-pages

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-TAG-V-1 | `listAllTagsWithCount returns tags sorted by count desc, name asc` | `src/lib/services/tags-public.test.ts` | node (integration with prisma test DB OR unit with mock) |
| SPEC-TAG-V-2 | `listAllTagsWithCount returns empty on empty DB` | 同上 | node |
| SPEC-TAG-V-3 | `getTagBySlug returns tag` | 同上 | node |
| SPEC-TAG-V-4 | `getTagBySlug returns null when missing` | 同上 | node |
| SPEC-TAG-I-1 | `TagsPage renders all tags with count + Link to /tags/{slug}` | `src/app/(site)/tags/page.test.tsx` | jsdom |
| SPEC-TAG-I-2 | `TagsPage empty state` | 同上 | jsdom |
| SPEC-TAG-I-3 | `TagsPage exports metadata` | 同上 | node-or-jsdom |
| SPEC-TAG-D-1 | `TagDetailPage renders tag header + posts list` | `src/app/(site)/tags/[slug]/page.test.tsx` | jsdom |
| SPEC-TAG-D-2 | `TagDetailPage calls notFound on missing tag` | 同上 | jsdom |
| SPEC-TAG-D-3 | `TagDetailPage pagination supported via searchParams` | 同上 | jsdom |
| SPEC-TAG-D-4 | `TagDetailPage generateMetadata returns tag-aware title` | 同上 | node-or-jsdom |
| SPEC-TAG-D-5 | `TagDetailPage empty state when 0 posts` | 同上 | jsdom |
| SPEC-TAG-L-1 | `PostCard tag link points to /tags/{slug}` | `src/components/site/PostCard.test.tsx` (extend) | jsdom |
| SPEC-TAG-L-2 | `Post detail page tag links use /tags/{slug}` (if applicable) | `src/app/(site)/posts/[slug]/page.test.tsx` | jsdom |

## Mock setup recommendation

### service tests
- Prefer **prisma mock** via `vi.mock("@/lib/db", ...)` or use existing test DB if project has one
- Inspect project: 若有 `src/lib/db.ts` 单例，mock 该 module；否则用 prisma's `__mocks__`

### page tests
- Mock service：`vi.mock("@/lib/services/tags-public", ...)` + `vi.mock("@/lib/services/posts", ...)`
- Mock `getCurrentLocale`：`vi.mock("@/lib/i18n", () => ({ getCurrentLocale: () => "zh" }))`
