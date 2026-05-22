# Handoff — analytics-dashboard

> 你（接收 AI）正在执行 TZBlog 的 analytics-dashboard SDD。预计 1 天（T3）。

## 30 秒概览

`/admin` 当前 stub。要把 PageView 表的数据展示成 dashboard：3 metric cards + trend SVG + 2 top lists + 2 distribution bars + range selector。零 chart lib（CSS+SVG）。每 widget 独立 fallback。

## 阅读顺序

1. master.md / handoff-guide.md / design-system.md / known-findings.md
2. `.claude/sdd/analytics-dashboard/proposal.md`
3. `.claude/sdd/analytics-dashboard/specs/{queries,components,page}/spec.md`
4. `.claude/sdd/analytics-dashboard/test-map.md`
5. `.claude/sdd/analytics-dashboard/design-notes.md` — 含 ASCII + query 完整骨架 + TrendChart SVG 实现
6. `.claude/sdd/analytics-dashboard/tasks.md`

## 依赖

- 现有 `src/lib/services/analytics.ts` (recordPageView 已存在，不动)
- 现有 `src/lib/db.ts` Prisma client
- PageView model schema 已定（device/browser/os 字段）
- Admin auth 已守 `/admin/*` via middleware

## 执行总览

```
§A queries (scope analytics-query)
§B components × 4 (scope metric-card / top-list / distribution-bar / trend-chart)
§C page (scope admin-dashboard)
```

12 commits 左右。

## 关键约束

- **零 chart lib** — 用内联 SVG polyline (R1)
- **不动 recordPageView** — 只扩 analytics.ts 加新函数
- **`$queryRaw` 只用 perDay** — 其它用 groupBy
- **`Prisma.sql` tagged template** — 防 SQL injection (since 是 Date object 安全；硬编码 path 模式)
- **公共 PUBLIC_PATH_WHERE** 排除 /admin /api (R5)
- **widget-level fallback** — safe() helper (R9)
- **全 RSC** — 不引 useState / use client
- **admin 风** — 不用 site Editorial tokens (R8)

## Editorial / admin 风区分

- **Site**：serif h1, hairline label, --text-hero, slow animation
- **Admin**（本任务）：sans-only, shadcn Card, smaller text scale, 功能优先

复用：shadcn primitives (Card / Button)；TZBlog 已有 Tailwind v4 setup。

## Query 实现 hints

design-notes 含 getViewSummary / getTopPaths / getDeviceDistribution 完整骨架（含 raw SQL 安全写法）。getTopReferrers、getBrowserDistribution 类似 groupBy pattern。

**注意 raw SQL**: 用 `Prisma.sql` template + `Prisma.empty` for conditional fragments，不要字符串拼接。

## 测试策略

- query 测试：**integration**（用 test DB seed PageView 行）— 若项目无 test DB，fallback 到 prisma client mock
- component 测试：standalone jsdom
- page 测试：mock 5 service functions

检查 `vitest.config.ts` 看有无 setupFiles 提供 DB connection。

## 禁止事项

| 禁止 | 为什么 |
|------|-------|
| 装 chart lib | R1 |
| 改 recordPageView | 不破坏现有 API |
| 改 PageView schema | 不需要 |
| client component | 全 RSC |
| 拼字符串 SQL | 用 Prisma.sql tagged |
| widget 抛错让整页崩 | R9 safe() |
| `--no-verify` | 违反 |

## 完成后输出

`.claude/sdd/analytics-dashboard/completion-report.md` 含：
- 12 commits hash
- query 测试是 integration 还是 mock
- empty DB smoke 截图描述
- dev server smoke 验证 widget 渲染

## TL;DR

```
读 SDD → §A queries RED+GREEN → §B 4 components RED+GREEN ×4 → §C page RED+GREEN → 质量门 → completion-report → 停。
```

收工。
