# Completion Report — analytics-dashboard

Date: 2026-05-22
Branch: `codex/analytics-dashboard`

## Quality Gates

| Gate | Result | Evidence |
|---|---|---|
| `pnpm typecheck` | PASS | `tsc --noEmit` completed in the final quality gate |
| `pnpm lint` | PASS | `eslint src --ext .ts,.tsx --max-warnings 0` completed in the final quality gate |
| `pnpm test` | PASS | 75 test files passed; 440 tests passed; 1 skipped |
| `pnpm build` | PASS | Next build compiled, type-checked, generated 27 static pages, and finalized route optimization |

## Spec Coverage

| Spec-ID | Test File | Test Function | Status |
|---|---|---|---|
| SPEC-AN-Q-1 | `src/lib/services/analytics.test.ts` | `getViewSummary returns total + unique + perDay with continuous days` | PASS |
| SPEC-AN-Q-2 | `src/lib/services/analytics.test.ts` | `getViewSummary supports "all" range capped at 30 entries` | PASS |
| SPEC-AN-Q-3 | `src/lib/services/analytics.test.ts` | `getTopPaths returns top N excluding /admin and /api` | PASS |
| SPEC-AN-Q-4 | `src/lib/services/analytics.test.ts` | `getTopReferrers excludes null referrers` | PASS |
| SPEC-AN-Q-5 | `src/lib/services/analytics.test.ts` | `getDeviceDistribution returns sorted with null -> unknown` | PASS |
| SPEC-AN-Q-6 | `src/lib/services/analytics.test.ts` | `getBrowserDistribution same shape as devices` | PASS |
| SPEC-AN-Q-7 | `src/lib/services/analytics.test.ts` | `all query functions return empty-safe on empty table` | PASS |
| SPEC-AN-C-1 | `src/components/admin/MetricCard.test.tsx` | `MetricCard renders label + formatted number + optional delta` | PASS |
| SPEC-AN-C-2 | `src/components/admin/TopList.test.tsx` | `TopList renders ranked items + empty state` | PASS |
| SPEC-AN-C-3 | `src/components/admin/DistributionBar.test.tsx` | `DistributionBar renders proportional bars` | PASS |
| SPEC-AN-C-4 | `src/components/admin/TrendChart.test.tsx` | `TrendChart renders SVG polyline + empty fallback` | PASS |
| SPEC-AN-P-1 | `src/app/(admin)/admin/page.test.tsx` | `AdminDashboardPage renders all 7 widgets` | PASS |
| SPEC-AN-P-2 | `src/app/(admin)/admin/page.test.tsx` | `AdminDashboardPage reads range from searchParams with default` | PASS |
| SPEC-AN-P-3 | `src/app/(admin)/admin/page.test.tsx` | `RangeSelector renders 4 options + active state` | PASS |
| SPEC-AN-P-4 | `src/app/(admin)/admin/page.test.tsx` | `widget failure shows fallback while others render` | PASS |

Query tests are integration tests against the configured test Postgres via `tests/helpers/db.ts`.

## Commit Timeline

| Commit | Time | Message |
|---|---|---|
| `11939b2` | 2026-05-22T16:44:23+08:00 | `test(analytics-query): SPEC-AN-Q-1..7 view summary + top + distribution queries` |
| `3c0d541` | 2026-05-22T16:48:24+08:00 | `feat(analytics-query): SPEC-AN-Q-1..7 dashboard query functions` |
| `74b6fa4` | 2026-05-22T16:52:59+08:00 | `test(metric-card): SPEC-AN-C-1 metric card render` |
| `63da8c7` | 2026-05-22T16:55:02+08:00 | `feat(metric-card): SPEC-AN-C-1 MetricCard component` |
| `c05102b` | 2026-05-22T16:56:17+08:00 | `test(top-list): SPEC-AN-C-2 top list rank + empty` |
| `452474c` | 2026-05-22T16:58:08+08:00 | `feat(top-list): SPEC-AN-C-2 TopList component` |
| `bf4d6f3` | 2026-05-22T16:59:05+08:00 | `test(distribution-bar): SPEC-AN-C-3 proportional bars` |
| `90f5765` | 2026-05-22T17:00:01+08:00 | `feat(distribution-bar): SPEC-AN-C-3 DistributionBar component` |
| `39359de` | 2026-05-22T17:03:04+08:00 | `test(trend-chart): SPEC-AN-C-4 SVG polyline + fallback` |
| `44a2e66` | 2026-05-22T17:04:50+08:00 | `feat(trend-chart): SPEC-AN-C-4 TrendChart inline SVG` |
| `4982675` | 2026-05-22T17:06:53+08:00 | `test(admin-dashboard): SPEC-AN-P-1..4 dashboard widgets + range + fallback` |
| `ac22549` | 2026-05-22T17:10:17+08:00 | `feat(admin-dashboard): SPEC-AN-P-1..4 dashboard with metric cards, trend, top lists, distributions` |

## Proposal R1..R9

| Requirement | Delivered |
|---|---|
| R1 CSS + inline SVG chart, zero chart library | `TrendChart` uses inline SVG `polyline`; no dependency added |
| R2 groupBy primary, raw SQL only for trend | Top paths/referrers/distributions use Prisma `groupBy`; per-day trend uses `$queryRaw` |
| R3 range options today / 7d / 30d / all | `RangeSelector` renders all four links and zod parses/falls back to `7d` |
| R4 unique visitor by distinct `visitorHash` | `getViewSummary` uses `distinct: ["visitorHash"]` |
| R5 exclude `/admin` and `/api` | Shared `PUBLIC_PATH_WHERE` plus `PUBLIC_PATH_SQL` exclude both prefixes |
| R6 dashboard cache 60s | `/admin` exports `revalidate = 60` |
| R7 searchParams + Link range selector | `/admin?range=...` links drive range without client state |
| R8 admin visual style | shadcn Card primitives, sans/admin utilities; no site Editorial components |
| R9 widget-level fallback | `safe()` wraps each widget query; `FailedWidget` renders per-widget fallback |

R10 timezone remains UTC as specified in proposal.

## Query Performance

Measured locally against the configured dev DB after smoke.

| Metric | Value |
|---|---:|
| `PageView` rows | 0 |
| `getViewSummary("30d")` | 29.87 ms |
| `getTopPaths("30d", 10)` | 4.22 ms |
| `getTopReferrers("30d", 10)` | 2.66 ms |
| `getDeviceDistribution("30d")` | 1.49 ms |
| `getBrowserDistribution("30d")` | 2.80 ms |

## Dev Smoke

- `pnpm dev` served on `http://localhost:3000`.
- In-app browser reached `http://localhost:3000/admin` while logged in as `smoke-admin@example.com`.
- `/admin?range=30d` rendered 3 metric cards, Trend, Top Paths, Top Referrers, Devices, Browsers, and the range selector.
- Range selector click to `30d` updated URL to `/admin?range=30d` and set `aria-current="page"` on the active option.
- Empty DB state rendered zero metric values and `No data` / `No trend data` states.
- Query-failure fallback was verified by `SPEC-AN-P-4` with `getTopPaths` rejected; live DB failure was not induced to avoid disrupting the dev database.
- Smoke screenshot: `/tmp/tzblog-admin-smoke.png`.

## File List

| File | Lines | Notes |
|---|---:|---|
| `src/lib/services/analytics.ts` | 269 | Extended only; `recordPageView` body unchanged |
| `src/lib/services/analytics.test.ts` | 340 | Added 7 integration specs |
| `src/components/admin/MetricCard.tsx` | 39 | New sync RSC-compatible component |
| `src/components/admin/MetricCard.test.tsx` | 36 | New jsdom spec |
| `src/components/admin/TopList.tsx` | 46 | New sync RSC-compatible component |
| `src/components/admin/TopList.test.tsx` | 45 | New jsdom spec |
| `src/components/admin/DistributionBar.tsx` | 63 | New sync RSC-compatible component |
| `src/components/admin/DistributionBar.test.tsx` | 46 | New jsdom spec |
| `src/components/admin/TrendChart.tsx` | 51 | New inline SVG component |
| `src/components/admin/TrendChart.test.tsx` | 44 | New jsdom spec |
| `src/app/(admin)/admin/page.tsx` | 219 | Dashboard composition |
| `src/app/(admin)/admin/page.test.tsx` | 142 | Page integration specs |
| `.claude/sdd/analytics-dashboard/completion-report.md` | n/a | This report |

Prompt B path constraint was followed: admin widgets were added under `src/components/admin/*` rather than the SDD draft's `src/components/admin/analytics/*`.

## §18 Sync Stub Mode

Not used. All four dashboard widgets are sync components, so `admin/page.test.tsx` renders the real widgets. The test mocks only `@/lib/services/analytics` and `@/lib/auth`; no widget was replaced with a §18 sync stub.
