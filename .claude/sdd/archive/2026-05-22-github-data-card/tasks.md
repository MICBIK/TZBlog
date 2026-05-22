# tasks.md — github-data-card

> 阶段前缀 `[GC]`
> commit scopes: `github-schema` / `github-service` / `github-card` / `site-home`

## §0 准备

- [ ] 读 SDD 全套 + master / handoff-guide / design-system / known-findings
- [ ] inspect: src/lib/env.ts (GITHUB_USERNAME 已存在), src/lib/errors.ts, src/lib/services/stats.ts (pattern)

## §A [GC] schema (SPEC-GC-S-1..5)

### A.1 [TEST-RED]
- 新建 `src/lib/schemas/github.test.ts`，5 spec
- 跑 → FAIL（schema 不存在）
- commit: `test(github-schema): SPEC-GC-S-1..5 zod schemas for GitHub API responses`

### A.1 [IMPL-GREEN]
- 新建 `src/lib/schemas/github.ts` 导出 3 个 schema
- 跑 → PASS
- commit: `feat(github-schema): SPEC-GC-S-1..5 zod schemas for /users + /repos + /events`

## §B [GC] service (SPEC-GC-V-1..6)

### B.1 [TEST-RED]
- 新建 `src/lib/services/github.test.ts`，6 spec（mock fetch）
- 跑 → FAIL
- commit: `test(github-service): SPEC-GC-V-1..6 getGithubData with ISR cache + fallback paths`

### B.1 [IMPL-GREEN]
- 新建 `src/lib/services/github.ts`：
  - `getGithubData()` 函数
  - 3 endpoints fetch with `{ next: { revalidate: 3600 } }`
  - parse via schemas
  - discriminated union return `{ status: "ok" | "unavailable", ... }`
  - missing env / 404 / 403+ratelimit / 5xx / parse fail / network 全 fallback
  - console.warn for diagnostics
- 跑 → PASS
- commit: `feat(github-service): SPEC-GC-V-1..6 anonymous GitHub data fetcher with ISR + graceful fallback`

## §C [GC] component (SPEC-GC-C-1..4)

### C.1 [TEST-RED]
- 新建 `src/components/site/GithubCard.test.tsx`，4 spec（mock service）
- 跑 → FAIL
- commit: `test(github-card): SPEC-GC-C-1..4 GithubCard success + fallback rendering`

### C.1 [IMPL-GREEN]
- 新建 `src/components/site/GithubCard.tsx`：
  - async RSC, calls getGithubData
  - SuccessState 子（内联或抽 sub-component）
  - FallbackState 子
  - Editorial styling: hairline / rule line / --text-h2 数字 / serif name
  - avatar `<img>` with alt + w-12 h-12 + loading="lazy"
- 跑 → PASS
- commit: `feat(github-card): SPEC-GC-C-1..4 GithubCard component with Editorial styling`

## §D [GC] integration (SPEC-GC-I-1)

### D.1 [TEST-RED]
- 在 src/app/(site)/page.test.tsx 加 spec
- 跑 → FAIL
- commit: `test(site-home): SPEC-GC-I-1 homepage integrates GithubCard`

### D.1 [IMPL-GREEN]
- 改 src/app/(site)/page.tsx：import + render `<GithubCard />` between TechStack and Recent Posts
- 跑 → PASS, full pnpm test
- commit: `feat(site-home): SPEC-GC-I-1 wire GithubCard into homepage`

## §E 验收

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] dev server manual smoke:
  - 若 GITHUB_USERNAME 已设：访问 / 看到真实数据
  - 若未设：fallback 显示
- [ ] git log 复核 8 commits
- [ ] completion-report.md

## §F 不归档
