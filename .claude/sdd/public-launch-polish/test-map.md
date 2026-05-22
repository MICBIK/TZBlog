# test-map.md — public-launch-polish

| Spec-ID | Test Layer | Test File | Test Function | Notes |
|---------|-----------|-----------|---------------|-------|
| markdown-reading-001 | unit | `src/lib/markdown.test.ts` | `renders GitHub-style alerts as semantic callouts` | RED before callout transform |
| markdown-reading-002 | component/source | `src/components/editor/MarkdownPreview.test.tsx` | `MarkdownPreview uses markdown-body reading class` | Prevents reliance on missing typography plugin |
| markdown-reading-003 | source/css | `src/app/globals.test.ts` | `defines markdown-body reading styles and callout variants` | CSS-only implementation after RED |
| markdown-reading-004 | unit | `src/lib/markdown.test.ts` | existing + extended XSS assertions | Ensure sanitize still strips dangerous HTML |
| admin-contrast-001 | source | `src/app/(admin)/admin/layout.test.tsx` | `AdminLayout uses foreground tokens for sidebar and header text` | Avoid async layout/auth friction |
| admin-contrast-002 | source | `src/app/(admin)/admin/layout.test.tsx` | `AdminLayout hover states preserve readable foreground tokens` | Same file |
| site-polish-001 | component/page | `src/app/(site)/page.test.tsx` | `homepage renders launch narrative and visual sections` | Mock async child RSC per systemPatterns §18 |
| site-polish-002 | unit/component | `src/lib/content/about.test.ts`, `src/app/(site)/about/page.test.tsx` | `about content explains architecture and principles` | Existing about tests extended |
| site-polish-003 | source/css | `src/app/globals.test.ts` | `defines launch-surface primitives with reduced-motion compatibility` | CSS primitives |
| i18n-roadmap-001 | source/docs | `tests/docs-sanity.test.ts` | `memory bank records i18n as V3 route and metadata debt` | Documentation debt |
| i18n-roadmap-002 | source/docs | `tests/docs-sanity.test.ts` | `system patterns describe V3 locale routing direction` | Documentation debt |

