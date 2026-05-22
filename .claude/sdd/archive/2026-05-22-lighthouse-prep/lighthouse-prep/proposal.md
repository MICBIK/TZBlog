# Proposal — lighthouse-prep

> Stage: Pre-deploy P2 cleanup（**最后一个 pre-deploy SDD**）
> Created: 2026-05-22
> Path: `.claude/sdd/lighthouse-prep/`
> Tier: T3 / 1 day（含 audit + 修复）
> 视觉方向：无（性能/SEO/a11y 性质）

## Why

上线前需要保证：
- Lighthouse 4 维 ≥ 90（Performance / Accessibility / Best Practices / SEO）
- Core Web Vitals 目标：LCP < 2.5s / INP < 200ms / CLS < 0.1
- security headers 到位
- sitemap / robots 正确
- metadata 完整（OG / Twitter Card）

不修这层：上线时 Lighthouse 红一片，SEO + perf 起点低，安全 header 缺失。

## What

5 类：

### Capability: SEO assets
- 新建 `src/app/sitemap.ts`（Next.js convention，动态生成 sitemap.xml 列所有 PUBLISHED post + 静态页）
- 新建 `src/app/robots.ts`（动态 robots.txt）
- 新建 `src/app/manifest.ts`（PWA manifest — title/theme color/icons）
- 新建 `src/app/icon.svg` / `src/app/apple-icon.png`（占位 SVG 即可，ha1den 后替）

### Capability: metadata defaults
- 改 `src/app/layout.tsx`（root）补全 metadata：
  - `metadataBase` (production URL，env-driven)
  - `title.template` ("%s — TZBlog")
  - default description
  - `openGraph` defaults
  - `twitter` defaults (card: summary_large_image)

### Capability: security headers
- 改 `next.config.ts` 加 `headers()`：
  - HSTS
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy
  - **CSP：先用 report-only，避免破坏现有功能；上线 1 周后切 enforce**

### Capability: image / font perf
- audit 所有 `<img>` 加 width/height
- 大图全用 `next/image`
- 字体确保 `font-display: swap`（next/font/google 默认 swap，验证一下）
- 移除任何 sync `<script>`，all async/defer
- audit `next/dynamic` 用法 — Tiptap editor 必须 dynamic (admin only)，避免 site bundle 含 editor

### Capability: a11y audit
- 跑 axe-core via @axe-core/playwright (or vitest axe matcher) 对 homepage / posts / about / tags / admin login
- 修所有 critical / serious 违规
- 重点：颜色对比（CSS vars）/ 键盘可达 / aria 标签

### 不在范围
- 装 lighthouse-ci action
- 集成 chromatic / percy
- 装 next-pwa / service worker
- 国际化 SEO（hreflang，MVP 单 zh）
- Schema.org structured data（增量）
- 性能 budget CI（pre-deploy 不引）
- 改 Tailwind tokens（外形不动）

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | sitemap 静态 vs 动态 | **动态 src/app/sitemap.ts** | post 动态增减，静态会过期 |
| R2 | CSP enforce vs report-only at launch | **report-only at launch** + 切换计划 | 避免上线即破坏；1 周后 enforce |
| R3 | image strategy | **next/image 全部** | LCP friendly + auto format |
| R4 | font strategy | **next/font/google** (already) + verify swap | 已 OK；audit only |
| R5 | a11y test framework | **vitest + jest-axe (or @axe-core/playwright)** | vitest 已用，jest-axe 集成简单 |
| R6 | manifest icon source | **占位 SVG 256x256** | ha1den 后期替 PNG |
| R7 | PWA 否 | **基础 manifest only**，不加 SW | 增量 |
| R8 | Lighthouse 测试方式 | **manual run + 文档化分数**（不入 CI） | pre-deploy 一次 baseline 够 |
| R9 | metadataBase env 来源 | **NEXTAUTH_URL 或新 PUBLIC_URL** | 必须 prod URL（不能 localhost） |
| R10 | sitemap 包含 admin? | **不**（robots disallow /admin） | 安全 |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| seo-assets | `specs/seo-assets/spec.md` | SPEC-LH-S-1..4 |
| metadata | `specs/metadata/spec.md` | SPEC-LH-M-1..3 |
| security | `specs/security/spec.md` | SPEC-LH-H-1..2 |
| perf | `specs/perf/spec.md` | SPEC-LH-P-1..3 |
| a11y | `specs/a11y/spec.md` | SPEC-LH-A-1..2 |

## Impact

- 新增：
  - `src/app/sitemap.ts` + `.test.ts`
  - `src/app/robots.ts` + `.test.ts`
  - `src/app/manifest.ts` + `.test.ts`
  - `src/app/icon.svg`（静态 placeholder）
  - `tests/a11y/*.test.ts`（or vitest config）
  - `tests/lighthouse-baseline.md`（手工 run 后记录分数 + screenshots）
- 修改：
  - `src/app/layout.tsx`（root metadata）
  - `next.config.ts`（headers）
  - 任何 `<img>` 缺 width/height 的（grep & 修）
- 依赖：可能新增 `jest-axe` 或 `@axe-core/playwright`
  - **新依赖须显式 ask ha1den 同意**（CLAUDE.md 规则）
  - fallback：用现有 jsdom + 手动 a11y 断言（颜色对比、role、name 等）

## Workflow

1. SDD 9 件套
2. **§A seo-assets**: 4 spec → 1 TDD pair
3. **§B metadata**: 3 spec → 1 TDD pair（root layout 改）
4. **§C security**: 2 spec → 1 TDD pair（next.config + integration test）
5. **§D perf**: 3 spec → 1 TDD pair（grep 验 img attrs / bundle check 文档化）
6. **§E a11y**: 2 spec → 1 TDD pair
7. **§F lighthouse baseline**: 手工 run，文档化（NO-TDD docs commit）
8. 质量门 + completion-report

## Risks

| 风险 | 缓解 |
|------|------|
| 修 CSP 把现有功能（Tiptap inline / MinIO image / auth callback）打挂 | report-only 模式 + 上线 1 周后 enforce + handoff 明确切换计划 |
| jest-axe 装包 ha1den 未授权 | 优先 fallback；必要时 handoff ask |
| metadataBase env 缺失 build fail | next 会 warn 而非 fail；加 conditional + console.warn |
| Tiptap editor bundle 进 site | dynamic import 已在 admin component；audit verify |
| Lighthouse < 90 分某项 | 文档化 baseline，列待改 backlog，**不阻塞上线**（除非 SEO/a11y critical） |
| icon.svg 占位太丑 | 256x256 simple "TZ" lettermark SVG，可接受 |
