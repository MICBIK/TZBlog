# design-notes — lighthouse-prep

## sitemap 完整 skeleton

见 specs/seo-assets/spec.md SPEC-LH-S-1。要点：
- 用 `MetadataRoute.Sitemap` 类型
- async 函数（DB 调用）
- `env.NEXT_PUBLIC_SITE_URL` 必须新增（提示 env.ts 改）

## robots 完整 skeleton

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next"
import { env } from "@/lib/env"

export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
```

## manifest 完整 skeleton

```ts
// src/app/manifest.ts
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TZBlog",
    short_name: "TZBlog",
    description: "ha1den 的技术博客",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  }
}
```

## icon.svg 占位（256x256 lettermark "TZ"）

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#0a0a0a"/>
  <text x="128" y="160" text-anchor="middle" font-family="Georgia, serif" font-size="120" font-weight="bold" fill="#fafafa">TZ</text>
</svg>
```

## OG image placeholder (1200x630)

可写一个简 SVG 转 PNG 脚本，或手工放 placeholder：纯灰底 + "TZBlog" 居中。pnpm dlx sharp 转一次性。

handoff 提醒 ha1den 后期生成真 OG（用 satori / `og` route handler 或手设计）。

## CSP 详细考虑

Tiptap 用 contenteditable + 可能 inline style → 必须允许 `'unsafe-inline'` 在 style-src。
Next.js dev 注入 eval → 必须 `'unsafe-eval'` 在 script-src（生产可去掉，handoff 提示）。
MinIO 图片是不同 origin (如 https://minio.your.domain) → `img-src` 含 `https:` 通配。

**CSP Report-Only 是关键** — 先收集 violation 报告，确认无破坏再切 enforce。

## perf audit 详查命令

```bash
# Find all <img> without dimensions
grep -rn "<img" src/ --include="*.tsx" | grep -v "width="

# Find Tiptap in site bundle (should be 0)
grep -rn "@tiptap" src/components/site/ src/app/\(site\)/ --include="*.tsx" --include="*.ts"

# Verify font display
grep -n "display" src/app/layout.tsx
```

## Lighthouse 跑法

```bash
pnpm build
pnpm start &  # PID
sleep 3
pnpm dlx lighthouse http://localhost:3000 \
  --output=html \
  --output-path=tests/lighthouse-baseline.html \
  --chrome-flags="--headless"
kill %1
```

## baseline.md template

```markdown
# Lighthouse Baseline — 2026-05-22

URL: http://localhost:3000
Build: pnpm build (commit <hash>)

## Scores

| Category | Score | Target |
|----------|-------|--------|
| Performance | XX | ≥ 90 |
| Accessibility | XX | ≥ 95 |
| Best Practices | XX | ≥ 95 |
| SEO | XX | ≥ 95 |

## CWV

| Metric | Value | Target |
|--------|-------|--------|
| LCP | Xs | < 2.5s |
| INP | Xms | < 200ms |
| CLS | X | < 0.1 |
| FCP | Xs | < 1.5s |
| TBT | Xms | < 200ms |

## Backlog (post-launch improvements)

- [ ] item if score < target
- ...
```

## 不要做的事

- 不装 next-pwa / service worker (R7)
- 不接 lighthouse-ci action
- 不写 Schema.org JSON-LD（增量）
- 不接 sentry / 任何 monitoring（next 增量）
- 不改 Tailwind tokens（外观不动）
- 不强制 CSP enforce（R2 Report-Only）
- 不删 'unsafe-inline' / 'unsafe-eval' from script-src（Tiptap 需要；nonce 升级是 next 增量）

## Risks 复述

- CSP 改坏功能 → Report-Only 模式 + 1 周观察
- jest-axe 装包 → ask first；fallback 手动
- og-default.png 占位丑 → handoff 提醒
- < 90 分某项 → 文档化 backlog，不阻塞上线
