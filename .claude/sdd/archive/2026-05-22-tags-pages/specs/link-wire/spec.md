# specs/link-wire — PostCard tag links 改 `/tags/{slug}`

> spec-id 前缀：`SPEC-TAG-L`

## SPEC-TAG-L-1 — PostCard renders tag chip linking to /tags/{slug}

```gherkin
GIVEN PostCard receives post with tags: [{ slug: "foo", name: "Foo" }]

WHEN render(<PostCard post={post} />)

THEN tag "Foo" rendered as `<a href="/tags/foo">Foo</a>` (or Link)
  NOT `<a href="/posts?tag=foo">Foo</a>`

Test (extend existing PostCard test or create new):
  const post = { ..., tags: [{ slug: "foo", name: "Foo" }] }
  render(<PostCard post={post} />)
  expect(getByRole("link", { name: "Foo" })).toHaveAttribute("href", "/tags/foo")
```

## SPEC-TAG-L-2 — Post detail page (if tags rendered there) uses new path

```gherkin
GIVEN src/app/(site)/posts/[slug]/page.tsx renders post.tags as links (if applicable)

WHEN render post detail

THEN each tag link points to `/tags/{slug}` not `/posts?tag={slug}`

Note: If post detail doesn't render tags as links, skip this spec.
Check current implementation first; if no tag links exist on detail, add them as part of this spec.
```

## Verification reminder

Run `grep -r "posts?tag=" src/` after changes — should find nothing in component files (might still appear in admin or query-aware UI, those are acceptable).
