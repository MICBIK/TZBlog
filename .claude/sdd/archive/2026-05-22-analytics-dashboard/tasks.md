# tasks.md — analytics-dashboard

> 阶段前缀 `[AN]`
> commit scopes: `analytics-query` / `metric-card` / `top-list` / `distribution-bar` / `trend-chart` / `admin-dashboard`

## §0 准备

- [ ] 读 SDD 全套 + master / handoff-guide / design-system / known-findings
- [ ] inspect:
  - `src/lib/services/analytics.ts` (现 recordPageView 单函数)
  - `src/lib/services/analytics.test.ts` (现 test setup)
  - `prisma/schema.prisma` PageView model
  - `src/app/(admin)/admin/page.tsx` (现 stub)
  - 是否有 PG test DB setup（看 vitest config / docker-compose）

## §A [AN] queries (SPEC-AN-Q-1..7)

### A.1 [TEST-RED]
- 扩 `src/lib/services/analytics.test.ts` 加 7 spec
- 跑 → FAIL
- commit: `test(analytics-query): SPEC-AN-Q-1..7 view summary + top + distribution queries`

### A.1 [IMPL-GREEN]
- 扩 `src/lib/services/analytics.ts` 加 5 函数：
  - `getViewSummary(range)`
  - `getTopPaths(range, limit)`
  - `getTopReferrers(range, limit)`
  - `getDeviceDistribution(range)`
  - `getBrowserDistribution(range)`
- 用 prisma groupBy + `$queryRaw` for perDay (with `Prisma.sql` tag)
- 公共 `rangeToDate` helper
- 公共 PUBLIC_PATH_FILTER
- 跑 → PASS
- commit: `feat(analytics-query): SPEC-AN-Q-1..7 dashboard query functions`

## §B [AN] components (SPEC-AN-C-1..4)

### B.1 MetricCard [TEST-RED + IMPL-GREEN]
- test → `test(metric-card): SPEC-AN-C-1 metric card render`
- impl → `feat(metric-card): SPEC-AN-C-1 MetricCard component`

### B.2 TopList [TEST-RED + IMPL-GREEN]
- test → `test(top-list): SPEC-AN-C-2 top list rank + empty`
- impl → `feat(top-list): SPEC-AN-C-2 TopList component`

### B.3 DistributionBar [TEST-RED + IMPL-GREEN]
- test → `test(distribution-bar): SPEC-AN-C-3 proportional bars`
- impl → `feat(distribution-bar): SPEC-AN-C-3 DistributionBar component`

### B.4 TrendChart [TEST-RED + IMPL-GREEN]
- test → `test(trend-chart): SPEC-AN-C-4 SVG polyline + fallback`
- impl → `feat(trend-chart): SPEC-AN-C-4 TrendChart inline SVG`

## §C [AN] page (SPEC-AN-P-1..4)

### C.1 [TEST-RED]
- 新建 `src/app/(admin)/admin/page.test.tsx`
- 4 spec
- 跑 → FAIL
- commit: `test(admin-dashboard): SPEC-AN-P-1..4 dashboard widgets + range + fallback`

### C.1 [IMPL-GREEN]
- 重写 `src/app/(admin)/admin/page.tsx` 按 design-notes skeleton
- safe() helper for widget-level fallback
- RangeSelector + FailedWidget sub-components
- 跑 → PASS, full pnpm test
- commit: `feat(admin-dashboard): SPEC-AN-P-1..4 dashboard with metric cards, trend, top lists, distributions`

## §D 验收

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] dev server smoke：
  - 登录 admin / 看 dashboard 渲染
  - 切 range 看数据变
  - empty DB 看 zero state
- [ ] completion-report.md

## §E 不归档
