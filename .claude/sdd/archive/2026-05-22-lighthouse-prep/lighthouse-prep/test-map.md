# test-map.md — lighthouse-prep

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-LH-S-1 | `sitemap() returns all PUBLISHED posts + static + tags` | `src/app/sitemap.test.ts` | node (mock prisma + tags-public) |
| SPEC-LH-S-2 | `robots() returns disallow /admin /api + sitemap link` | `src/app/robots.test.ts` | node |
| SPEC-LH-S-3 | `manifest() returns PWA basics` | `src/app/manifest.test.ts` | node |
| SPEC-LH-S-4 | `icon.svg exists and is valid SVG` | `src/app/icon.test.ts` (or generic) | node |
| SPEC-LH-M-1 | `root layout exports metadataBase + title template` | `src/app/layout.metadata.test.ts` | node |
| SPEC-LH-M-2 | `root layout openGraph defaults` | 同上 | node |
| SPEC-LH-M-3 | `root layout twitter defaults` | 同上 | node |
| SPEC-LH-H-1 | `next.config exports security headers` | `tests/next-config-headers.test.ts` | node (parse config) |
| SPEC-LH-H-2 | `next.config emits CSP Report-Only` | 同上 | node |
| SPEC-LH-P-1 | `all <img> tags have width + height + alt` | `tests/img-attrs.test.ts` | node (glob src) |
| SPEC-LH-P-2 | `Tiptap not imported in site bundle` | `tests/tiptap-isolation.test.ts` | node (glob src) |
| SPEC-LH-P-3 | `next/font uses display: swap` | `tests/font-display.test.ts` | node (read layout) |
| SPEC-LH-A-1 | `homepage axe no critical violations` (or fallback) | `tests/a11y/homepage.a11y.test.tsx` | jsdom |
| SPEC-LH-A-2 | `admin login axe no critical violations` (or fallback) | `tests/a11y/admin-login.a11y.test.tsx` | jsdom |

## Test setup notes

### config / file-system tests
- 直接 read file string + assert. 无需 mock.
- glob via `glob` package or `fs.readdir` recursion (项目已有？check)

### sitemap test
- mock `@/lib/db` + `@/lib/services/tags-public`
- assert URL strings + lastModified type

### a11y tests
- prefer jest-axe（如 ha1den 同意装）
- fallback：手动断言（landmark / heading / label / link names）

### Manual Lighthouse run
- 不是自动 test，是 completion-report 的一部分
- `pnpm build && pnpm start` → `lighthouse http://localhost:3000`
- 截图 + 分数记录到 `tests/lighthouse-baseline.md`
