# Proposal — analytics-dashboard

> Stage: Pre-deploy P2 cleanup
> Created: 2026-05-22
> Path: `.claude/sdd/analytics-dashboard/`
> Tier: T3 / 1 day
> 视觉方向：admin dashboard（功能优先；shadcn 风；与 site Editorial 区分）

## Why

`PageView` 表已在 `recordPageView` 入库；但：
- admin `/admin` 是 stub（只有 welcome 文字）
- 无 query / aggregate 暴露
- ha1den 上线后没法看流量数据

Pre-deploy 必须给 admin dashboard 提供：
- 今天 / 7 天 / 30 天 总浏览量
- 热门 path（top 10）
- 热门 referrer（top 10）
- device / browser 分布
- 每日 trend（最近 30 天）

不修这层：dashboard 是空的，PageView 数据是黑箱。

## What

3 layer：

### Capability: analytics queries
- 在 `src/lib/services/analytics.ts` 扩展（不破坏现有 recordPageView）
- 加纯查询函数（每个对应一个 dashboard widget）：
  - `getViewSummary(range): { total, unique, perDay: [{date, count}] }`
  - `getTopPaths(range, limit=10): Array<{path, count}>`
  - `getTopReferrers(range, limit=10): Array<{referrer, count}>`
  - `getDeviceDistribution(range): Array<{device, count}>`
  - `getBrowserDistribution(range): Array<{browser, count}>`
- range param: `"today" | "7d" | "30d" | "all"`
- 用 prisma groupBy + raw SQL（perDay trend 需 date_trunc）

### Capability: dashboard components
- 新建 `src/components/admin/analytics/`
  - `MetricCard.tsx`（大数字 + 标签 + delta）
  - `TopList.tsx`（rank 列表，复用 path / referrer）
  - `DistributionBar.tsx`（横向 bar，device / browser）
  - `TrendChart.tsx`（mini line/area chart，最近 30 天 perDay）
- chart 用纯 CSS / SVG（不引 recharts 等）— pre-deploy 减依赖

### Capability: admin dashboard page
- 改 `src/app/(admin)/admin/page.tsx`
- async RSC，调 5 个 query function（parallel）
- 渲染 MetricCard × 3 (today/7d/30d totals) + TopList × 2 + DistributionBar × 2 + TrendChart × 1
- Range selector（searchParams：默认 7d）

### 不在范围
- 实时流量（live）
- 地理位置 / IP geocoding
- A/B test
- conversion funnel
- export to CSV
- 第三方 analytics 集成（umami / plausible 等）
- 装 chart library
- per-user analytics

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | chart lib (recharts / chart.js) vs CSS SVG | **CSS + 内联 SVG** | 零依赖；trend 简到几行 SVG path 够 |
| R2 | 用 prisma groupBy vs raw SQL | **groupBy 为主，trend perDay 用 $queryRaw** | groupBy 不支持 date_trunc；trend 单独 raw |
| R3 | range 选项 | **today / 7d / 30d / all** | 覆盖常用 |
| R4 | unique visitor 算法 | **distinct visitorHash** | 现有字段够 |
| R5 | top path 排名包含 admin paths? | **排除 /admin/* 和 /api/***  | 只看公共内容流量 |
| R6 | dashboard 缓存 | **revalidate 60s** (admin 接受短缓存) | 减 DB 压力 |
| R7 | range selector 实现 | **searchParams + Link** | RSC 友好，无 client state |
| R8 | UI 风格 | **admin 风（shadcn Card 系）** | 区别于 site Editorial；admin 是工具 |
| R9 | 错误处理 | **service 抛 AppError，page 用 try/catch 渲染 fallback widget** | dashboard 不能整页崩 |
| R10 | timezone for perDay grouping | **UTC** (db 默认) | 简单；future 可加 tz 选择 |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| queries | `specs/queries/spec.md` | SPEC-AN-Q-1..7 |
| components | `specs/components/spec.md` | SPEC-AN-C-1..4 |
| page | `specs/page/spec.md` | SPEC-AN-P-1..4 |

## Impact

- 新增：
  - 在 `src/lib/services/analytics.ts` 加 5 个函数（+ `.test.ts` 扩展）
  - `src/components/admin/analytics/MetricCard.tsx` + test
  - `src/components/admin/analytics/TopList.tsx` + test
  - `src/components/admin/analytics/DistributionBar.tsx` + test
  - `src/components/admin/analytics/TrendChart.tsx` + test
- 修改：
  - `src/app/(admin)/admin/page.tsx`（完整重写）
- 依赖：无新装

## Workflow

1. SDD 9 件套
2. **§A queries**: 7 spec → 1 TDD pair（用 prisma integration test 或 mock）
3. **§B components**: 4 spec → 4 个 TDD pair（每 component 一组 commit）
4. **§C page**: 4 spec → 1 TDD pair
5. 质量门 + completion-report

## Risks

| 风险 | 缓解 |
|------|------|
| `$queryRaw` SQL injection（range arg） | 用 Prisma.raw / sql tagged template + 白名单 enum |
| date_trunc 跨 PG 版本兼容 | PG 12+ 都支持，TZBlog 用 PG 16 OK |
| 大数据量 groupBy 慢 | 加 LIMIT；PageView 已有 createdAt index |
| chart SVG 在 dark mode 不可见 | 用 `currentColor` + CSS var fill |
| 分布 widget 当 device 全 unknown 时空 | 显示 "No data" state |
| query function 抛错让 dashboard 整页 fail | R9 service throws + page catches |
