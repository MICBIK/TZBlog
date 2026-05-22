# specs/metadata — root layout 默认 metadata

> spec-id 前缀：`SPEC-LH-M`

## SPEC-LH-M-1 — root layout exports metadataBase + title template

```gherkin
GIVEN src/app/layout.tsx

WHEN metadata exported

THEN it includes:
  - metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  - title: { default: "TZBlog — <tagline>", template: "%s — TZBlog" }
  - description: <非空 string>

Test:
  import * as layout from "@/app/layout"
  expect(layout.metadata.metadataBase).toBeInstanceOf(URL)
  expect(layout.metadata.title?.template).toBe("%s — TZBlog")
```

## SPEC-LH-M-2 — openGraph defaults

```gherkin
THEN metadata.openGraph contains:
  - title (same as default)
  - description
  - siteName: "TZBlog"
  - locale: "zh_CN"
  - type: "website"
  - images: [{ url: "/og-default.png", width: 1200, height: 630 }]  // ha1den 后期生成；placeholder OK
```

Note: /og-default.png 是 placeholder。可在 public/ 放个简 1200x630 占位 PNG，handoff 提醒 ha1den 替。

## SPEC-LH-M-3 — twitter defaults

```gherkin
THEN metadata.twitter contains:
  - card: "summary_large_image"
  - title
  - description
  - images: [(same OG image)]
```

## env 增量

需在 `src/lib/env.ts` 加：
```ts
NEXT_PUBLIC_SITE_URL: z.string().url().optional()
```

`NEXT_PUBLIC_` 前缀使 client 可见（Next.js）。

## layout 改动 skeleton

```tsx
import type { Metadata } from "next"
import { env } from "@/lib/env"

const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TZBlog — 自研技术博客",
    template: "%s — TZBlog",
  },
  description: "ha1den 的技术博客，自部署在 VPS 上。",
  openGraph: {
    title: "TZBlog",
    description: "ha1den 的技术博客",
    siteName: "TZBlog",
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TZBlog",
    description: "ha1den 的技术博客",
    images: ["/og-default.png"],
  },
}
```
