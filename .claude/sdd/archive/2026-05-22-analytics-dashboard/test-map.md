# test-map.md — analytics-dashboard

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-AN-Q-1 | `getViewSummary returns total + unique + perDay with continuous days` | `src/lib/services/analytics.test.ts` (extend) | node (integration w/ test DB) |
| SPEC-AN-Q-2 | `getViewSummary supports "all" range capped at 30 entries` | 同上 | node |
| SPEC-AN-Q-3 | `getTopPaths returns top N excluding /admin and /api` | 同上 | node |
| SPEC-AN-Q-4 | `getTopReferrers excludes null referrers` | 同上 | node |
| SPEC-AN-Q-5 | `getDeviceDistribution returns sorted with null → unknown` | 同上 | node |
| SPEC-AN-Q-6 | `getBrowserDistribution same shape as devices` | 同上 | node |
| SPEC-AN-Q-7 | `all query functions return empty-safe on empty table` | 同上 | node |
| SPEC-AN-C-1 | `MetricCard renders label + formatted number + optional delta` | `src/components/admin/analytics/MetricCard.test.tsx` | jsdom |
| SPEC-AN-C-2 | `TopList renders ranked items + empty state` | `src/components/admin/analytics/TopList.test.tsx` | jsdom |
| SPEC-AN-C-3 | `DistributionBar renders proportional bars` | `src/components/admin/analytics/DistributionBar.test.tsx` | jsdom |
| SPEC-AN-C-4 | `TrendChart renders SVG polyline + empty fallback` | `src/components/admin/analytics/TrendChart.test.tsx` | jsdom |
| SPEC-AN-P-1 | `AdminDashboardPage renders all 7 widgets` | `src/app/(admin)/admin/page.test.tsx` | jsdom |
| SPEC-AN-P-2 | `AdminDashboardPage reads range from searchParams with default` | 同上 | jsdom |
| SPEC-AN-P-3 | `RangeSelector renders 4 options + active state` | 同上 | jsdom |
| SPEC-AN-P-4 | `widget failure shows fallback while others render` | 同上 | jsdom |

## Test setup notes

### Query tests (node)
- 项目已有 `src/lib/services/analytics.test.ts`（recordPageView 测试），延用其 setup
- 推荐 integration with test PG container（design-notes 详）
- 若 unit + prisma mock，需 mock `db.pageView.groupBy` + `db.$queryRaw`

### Component tests (jsdom)
- standalone，无需 mock service
- DistributionBar 用 `data-testid="bar"` + `toHaveStyle` 断言 width

### Page tests (jsdom)
- mock 5 service functions
- 测 default range / explicit range / failure 路径
- mock `auth()` if page reads session
