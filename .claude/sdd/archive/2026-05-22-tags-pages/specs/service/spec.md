# specs/service — tags-public service

> spec-id 前缀：`SPEC-TAG-V`

## SPEC-TAG-V-1 — listAllTagsWithCount returns tags sorted

```gherkin
GIVEN DB has tags: { foo (3 published posts), bar (1 published), baz (0 published, 2 draft) }

WHEN listAllTagsWithCount(locale)

THEN returns:
  [
    { slug: "foo", name: "Foo", count: 3 },
    { slug: "bar", name: "Bar", count: 1 },
    { slug: "baz", name: "Baz", count: 0 },
  ]

AND count only includes PUBLISHED posts
AND order is count DESC, then name ASC
```

Implementation:
```ts
return db.tag.findMany({
  select: {
    slug: true,
    name: true,
    _count: {
      select: {
        posts: { where: { post: { status: "PUBLISHED" } } }
      }
    }
  },
  orderBy: [{ posts: { _count: "desc" } }, { name: "asc" }]
}).then(rows => rows.map(r => ({ slug: r.slug, name: r.name, count: r._count.posts })))
```

## SPEC-TAG-V-2 — listAllTagsWithCount returns empty array on empty DB

```gherkin
GIVEN DB has no tags
WHEN listAllTagsWithCount(locale)
THEN returns []
```

## SPEC-TAG-V-3 — getTagBySlug returns tag

```gherkin
GIVEN DB has tag with slug "foo"
WHEN getTagBySlug("foo")
THEN returns { id, slug: "foo", name: ... }
```

## SPEC-TAG-V-4 — getTagBySlug returns null when missing

```gherkin
GIVEN DB has no tag with slug "missing"
WHEN getTagBySlug("missing")
THEN returns null
```

## Note on locale

Tag has no i18n in current schema (Tag.name is single column). `locale` param is reserved for future use, accept but unused in MVP. Document this in the impl file.
