# test-map.md — analytics-beacon

> spec-id → 测试函数 + 文件 + 层级

## track-schema

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-A-S-1 | `accepts valid path + referrer` | `src/lib/schemas/analytics.test.ts` | unit (zod) |
| SPEC-A-S-2 | `rejects invalid path (empty / no leading slash / too long)` | `src/lib/schemas/analytics.test.ts` | unit (zod) |
| SPEC-A-S-3 | `rejects invalid referrer (non-url / too long)` | `src/lib/schemas/analytics.test.ts` | unit (zod) |

## analytics-service

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-A-V-1 | `recordPageView inserts row with parsed UA + referrer` | `src/lib/services/analytics.test.ts` | integration |
| SPEC-A-V-2 | `recordPageView treats missing referrer as null` | `src/lib/services/analytics.test.ts` | integration |

## track-api

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-A-A-1 | `POST /api/track inserts PageView + returns 204` | `src/app/api/track/route.test.ts` | integration |
| SPEC-A-A-2 | `DNT header → 204 no DB write` | `src/app/api/track/route.test.ts` | integration |
| SPEC-A-A-3 | `path blacklist (/admin /api /login) → 204 no DB write` | `src/app/api/track/route.test.ts` | integration |
| SPEC-A-A-4 | `rate-limit 60/min → 429 on 61st call` | `src/app/api/track/route.test.ts` | integration |
| SPEC-A-A-5 | `invalid path → 400 zod error` | `src/app/api/track/route.test.ts` | integration |

## analytics-beacon

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-A-B-1 | `mount + path change fires sendBeacon` | `src/components/site/AnalyticsBeacon.test.tsx` | jsdom |
| SPEC-A-B-2 | `admin / login path skip` | `src/components/site/AnalyticsBeacon.test.tsx` | jsdom |
| SPEC-A-B-3 | `DNT browser setting skip` | `src/components/site/AnalyticsBeacon.test.tsx` | jsdom |
| SPEC-A-B-4 | `sendBeacon undefined → fetch keepalive fallback` | `src/components/site/AnalyticsBeacon.test.tsx` | jsdom |

## layout-integration

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-A-L-1 | `SiteLayout renders <AnalyticsBeacon />` | `src/app/(site)/layout.test.tsx` | jsdom |

## 备注

- integration 用 dev Postgres + tests/helpers/db
- API 测试 mock 不需 auth（公开 POST）
- jsdom 测试 mock next/navigation usePathname + navigator.sendBeacon
- 不引入新依赖
