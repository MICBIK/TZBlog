# specs/detail — `/tags/[slug]` 详情页

> spec-id 前缀：`SPEC-TAG-D`

## SPEC-TAG-D-1 — renders tag header + posts list

```gherkin
GIVEN params.slug = "foo"
  AND getTagBySlug returns { slug: "foo", name: "Foo" }
  AND listPosts({ tag: "foo", status: "PUBLISHED", page: 1, pageSize: 12 }, locale) returns { items: [post1, post2], total: 2, page: 1, pageSize: 12 }

WHEN render

THEN page shows:
  - hairline label "TAG"
  - h1 "Foo"
  - count subtitle "2 posts"
  - PostCard list (use existing PostCard component)

Test (mock both services):
  render(await TagDetailPage({ params: Promise.resolve({ slug: "foo" }), searchParams: Promise.resolve({}) }))
  expect(getByRole("heading", { level: 1, name: "Foo" })).toBeInTheDocument()
  expect(getByText("2 posts")).toBeInTheDocument()
```

## SPEC-TAG-D-2 — 404 on missing tag

```gherkin
GIVEN params.slug = "missing"
  AND getTagBySlug returns null

WHEN render

THEN calls notFound() (Next.js) → triggers 404

Test:
  vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NOT_FOUND") }) }))
  await expect(TagDetailPage({ params: Promise.resolve({ slug: "missing" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NOT_FOUND")
```

## SPEC-TAG-D-3 — pagination supported

```gherkin
GIVEN searchParams = { page: "2" }
  AND listPosts called with { tag, page: 2, pageSize: 12, status: "PUBLISHED" }

WHEN render

THEN listPosts received page === 2
AND prev/next pagination links visible if applicable

Test: spy listPosts, assert call args include page: 2
```

## SPEC-TAG-D-4 — generateMetadata returns tag-specific title

```gherkin
GIVEN params.slug = "foo"

WHEN generateMetadata({ params }) called

THEN returns { title: "Foo — Tag", description: "Posts tagged with Foo" } (or similar tag-aware text)
AND if tag missing → returns { title: "Tag not found" } or similar
```

## SPEC-TAG-D-5 — empty state

```gherkin
GIVEN tag exists but listPosts returns { items: [], total: 0, ... }

WHEN render

THEN shows "No posts in this tag yet" message (non-crashy)
AND header still shows tag name
```

## Page skeleton

```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTagBySlug, type Tag } from "@/lib/services/tags-public"
import { listPosts } from "@/lib/services/posts"
import { postFilterSchema } from "@/lib/schemas/post"
import { getCurrentLocale } from "@/lib/i18n"
import { PostCard } from "@/components/site/PostCard"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTagBySlug(slug)
  if (!tag) return { title: "Tag not found" }
  return {
    title: `${tag.name} — Tag`,
    description: `Posts tagged with ${tag.name}`,
  }
}

export default async function TagDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const tag = await getTagBySlug(slug)
  if (!tag) notFound()

  const sp = await searchParams
  const filter = postFilterSchema.parse({
    page: sp.page,
    pageSize: 12,
    status: "PUBLISHED",
    tag: slug,
  })
  const locale = getCurrentLocale()
  const { items, total, page, pageSize } = await listPosts(filter, locale)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <p className="font-mono uppercase text-[var(--text-label)] tracking-[var(--tracking-label)] text-muted-fg">
          Tag
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h1 className="font-serif text-[var(--text-h1)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg">
          {tag.name}
        </h1>
        <p className="font-mono text-sm text-muted-fg">{total} {total === 1 ? "post" : "posts"}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-muted-fg">No posts in this tag yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {items.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {/* pagination component, follow posts list page pattern */}
    </article>
  )
}
```
