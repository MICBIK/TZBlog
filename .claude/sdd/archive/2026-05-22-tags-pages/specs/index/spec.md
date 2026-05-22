# specs/index — `/tags` index page

> spec-id 前缀：`SPEC-TAG-I`

## SPEC-TAG-I-1 — renders all tags with count

```gherkin
GIVEN listAllTagsWithCount returns [{ slug: "foo", name: "Foo", count: 3 }, { slug: "bar", name: "Bar", count: 1 }]

WHEN render /tags page

THEN page shows:
  - h1 "Tags"
  - hairline label "TAGS · INDEX"
  - rule line
  - list of tags: each shows name + count
  - each tag is a Link to `/tags/{slug}`

Test (mock listAllTagsWithCount):
  vi.mock("@/lib/services/tags-public", ...)
  render(await TagsPage())
  expect(getByRole("link", { name: /Foo/ })).toHaveAttribute("href", "/tags/foo")
  expect(getByText(/3/)).toBeInTheDocument()
```

## SPEC-TAG-I-2 — empty state

```gherkin
GIVEN listAllTagsWithCount returns []
WHEN render /tags
THEN shows empty message "No tags yet" (or similar) — non-crashy
```

## SPEC-TAG-I-3 — metadata

```gherkin
GIVEN /tags page
THEN exports `metadata: Metadata = { title: "Tags", description: <非空> }`
```

## Page skeleton

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import { listAllTagsWithCount } from "@/lib/services/tags-public"
import { getCurrentLocale } from "@/lib/i18n"

export const metadata: Metadata = {
  title: "Tags",
  description: "All tags on TZBlog",
}

export default async function TagsPage() {
  const locale = getCurrentLocale()
  const tags = await listAllTagsWithCount(locale)

  return (
    <article className="space-y-[var(--space-section)]">
      <header className="space-y-3">
        <p className="font-mono uppercase text-[var(--text-label)] tracking-[var(--tracking-label)] text-muted-fg">
          Tags · Index
        </p>
        <div className="h-px w-12 border-t border-border" aria-hidden="true" />
        <h1 className="font-serif text-[var(--text-h1)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-fg">
          Tags
        </h1>
      </header>

      {tags.length === 0 ? (
        <p className="text-muted-fg">No tags yet.</p>
      ) : (
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {tags.map(tag => (
            <li key={tag.slug}>
              <Link
                href={`/tags/${tag.slug}`}
                className="group flex items-baseline justify-between border-b border-border py-2 hover:border-fg transition-colors"
              >
                <span className="font-serif text-fg group-hover:underline">{tag.name}</span>
                <span className="font-mono text-sm text-muted-fg">{tag.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
```
