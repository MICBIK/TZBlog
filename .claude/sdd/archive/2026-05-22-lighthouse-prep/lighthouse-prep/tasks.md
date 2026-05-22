# tasks.md — lighthouse-prep

> 阶段前缀 `[LH]`
> commit scopes: `seo-assets` / `seo-metadata` / `security-headers` / `perf-audit` / `a11y-audit` / `lighthouse-baseline`

## §0 准备

- [ ] 读 SDD 全套 + master / handoff-guide / known-findings
- [ ] inspect:
  - `next.config.ts` 当前 headers 设置
  - `src/app/layout.tsx` 当前 metadata
  - `src/lib/env.ts` 看是否已有 site URL env
  - 现有 `<img>` 用法（grep）
  - Tiptap 使用情况（grep `@tiptap`）
- [ ] **ASK ha1den**: 是否同意 `pnpm add -D jest-axe @types/jest-axe`？
  - 同意 → 用 jest-axe
  - 不同意 → fallback 手动断言，completion-report 标 deferred

## §A [LH] seo-assets (SPEC-LH-S-1..4)

### A.1 [TEST-RED]
- 4 个 test 文件：sitemap/robots/manifest/icon
- 跑 → FAIL
- commit: `test(seo-assets): SPEC-LH-S-1..4 sitemap + robots + manifest + icon`

### A.1 [IMPL-GREEN]
- 新建 `src/app/sitemap.ts` / `robots.ts` / `manifest.ts` / `icon.svg`
- icon.svg：256x256 简单 "TZ" lettermark
- 跑 → PASS
- commit: `feat(seo-assets): SPEC-LH-S-1..4 dynamic sitemap + robots + manifest + lettermark icon`

## §B [LH] metadata (SPEC-LH-M-1..3)

### B.1 [TEST-RED]
- 新建 `src/app/layout.metadata.test.ts`
- 跑 → FAIL
- commit: `test(seo-metadata): SPEC-LH-M-1..3 root layout metadata + OG + Twitter`

### B.1 [IMPL-GREEN]
- 改 `src/lib/env.ts` 加 `NEXT_PUBLIC_SITE_URL`
- 改 `src/app/layout.tsx` 添加完整 metadata
- 加 `public/og-default.png` placeholder (1200x630 灰底白字 "TZBlog")
- 跑 → PASS
- commit: `feat(seo-metadata): SPEC-LH-M-1..3 root layout metadata with OG defaults`

## §C [LH] security (SPEC-LH-H-1..2)

### C.1 [TEST-RED]
- 新建 `tests/next-config-headers.test.ts`
- 跑 → FAIL
- commit: `test(security-headers): SPEC-LH-H-1..2 security headers + CSP report-only`

### C.1 [IMPL-GREEN]
- 改 `next.config.ts` 加 `headers()`
- CSP 用 Report-Only
- 跑 → PASS
- commit: `feat(security-headers): SPEC-LH-H-1..2 HSTS/XFO/CSP-report-only`

## §D [LH] perf audit (SPEC-LH-P-1..3)

### D.1 [TEST-RED]
- 3 个测试文件
- 跑 → 可能 FAIL（如有 img 缺 dim）
- commit: `test(perf-audit): SPEC-LH-P-1..3 img attrs + tiptap isolation + font swap`

### D.1 [IMPL-GREEN]
- 修任何 `<img>` 缺 width/height/alt 的（grep + edit）
- 验 Tiptap 全 dynamic import in admin
- 验 next/font/google `display: "swap"` 显式（若无加）
- 跑 → PASS
- commit: `feat(perf-audit): SPEC-LH-P-1..3 fix img dims + verify font swap + tiptap dynamic`

## §E [LH] a11y (SPEC-LH-A-1..2)

### E.1 [TEST-RED]
- 新建 `tests/a11y/*.test.tsx`
- 跑 → FAIL
- commit: `test(a11y-audit): SPEC-LH-A-1..2 homepage + admin login a11y baseline`

### E.1 [IMPL-GREEN]
- 修任何 critical / serious violation（focus ring / label / heading order / etc.）
- 跑 → PASS
- commit: `feat(a11y-audit): SPEC-LH-A-1..2 fix axe violations`

## §F [LH] lighthouse baseline (NO-TDD)

### F.1 手工 run
- `pnpm build && pnpm start &`
- `pnpm dlx lighthouse http://localhost:3000 --output html --output-path tests/lighthouse-baseline.html` (or use browser DevTools)
- 截图 4 维分数
- 新建 `tests/lighthouse-baseline.md` 记录分数 + 待改 backlog（< 90 的项）
- commit: `docs(lighthouse-baseline): record 2026-05-22 baseline scores [no-tdd]`

## §G 验收

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] dev server 跑一次看 response headers (curl -I)
- [ ] Lighthouse run 4 维分数 ≥ 80（目标 90，记录在 baseline.md）
- [ ] axe 0 critical / 0 serious
- [ ] sitemap.xml 在浏览器访问看到内容
- [ ] robots.txt 同上
- [ ] completion-report.md (含 jest-axe 是否装、CSP 切换计划、baseline 分数)

## §H 不归档
