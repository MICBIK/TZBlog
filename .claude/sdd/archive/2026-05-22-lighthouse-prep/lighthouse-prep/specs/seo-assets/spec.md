# specs/seo-assets — sitemap / robots / manifest / icon

> spec-id 前缀：`SPEC-LH-S`

## SPEC-LH-S-1 — sitemap.ts generates dynamic sitemap

```gherkin
GIVEN DB has 3 PUBLISHED posts (slugs: foo, bar, baz)
  AND 2 static pages exist (/about, /tags)

WHEN sitemap() called (Next.js convention export)

THEN returns MetadataRoute.Sitemap array containing:
  - { url: "https://prod/" }
  - { url: "https://prod/posts" }
  - { url: "https://prod/posts/foo" }
  - { url: "https://prod/posts/bar" }
  - { url: "https://prod/posts/baz" }
  - { url: "https://prod/about" }
  - { url: "https://prod/tags" }
  - 1 entry per Tag (call listAllTagsWithCount)

AND each entry has lastModified date (post.updatedAt for posts; today for static)
AND each entry has changeFrequency + priority
AND NO admin paths included
```

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { listAllTagsWithCount } from "@/lib/services/tags-public"
import { env } from "@/lib/env"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const [posts, tags] = await Promise.all([
    db.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    listAllTagsWithCount("zh"),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/posts`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/columns`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/tags`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]

  const postEntries: MetadataRoute.Sitemap = posts.map(p => ({
    url: `${base}/posts/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const tagEntries: MetadataRoute.Sitemap = tags.map(t => ({
    url: `${base}/tags/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.4,
  }))

  return [...staticPages, ...postEntries, ...tagEntries]
}
```

## SPEC-LH-S-2 — robots.ts blocks /admin and /api

```gherkin
WHEN robots() called

THEN returns MetadataRoute.Robots:
  {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }
    ],
    sitemap: "<base>/sitemap.xml"
  }
```

## SPEC-LH-S-3 — manifest.ts PWA basics

```gherkin
WHEN manifest() called

THEN returns MetadataRoute.Manifest:
  {
    name: "TZBlog",
    short_name: "TZBlog",
    description: <非空>,
    start_url: "/",
    display: "standalone",
    theme_color: <hsl from --bg>,
    background_color: <hsl from --bg>,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
  }
```

## SPEC-LH-S-4 — /icon.svg exists at correct path

```gherkin
GIVEN /src/app/icon.svg exists (Next.js auto-serves as /icon.svg)

THEN file is a valid SVG, viewBox 0 0 256 256
AND contains some marker (e.g., text "TZ" or path)
AND fileSize > 0
```
