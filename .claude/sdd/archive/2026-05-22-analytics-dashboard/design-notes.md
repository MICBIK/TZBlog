# design-notes — analytics-dashboard

## ASCII mockup

```
┌────────────────────────────────────────────────────────────────────┐
│ Dashboard                              [today] [7d*] [30d] [all]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                            │
│ │ TODAY    │ │ 7 DAYS   │ │ 30 DAYS  │                            │
│ │ 1,234    │ │ 8,901    │ │ 32,456   │                            │
│ └──────────┘ └──────────┘ └──────────┘                            │
│                                                                    │
│ TREND                                                              │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │       ╱╲      ╱╲                                              │ │
│ │   ╱╲ ╱  ╲ ╱╲ ╱  ╲ ╱╲                                          │ │
│ │  ╱  ╲    ╱  ╲    ╱  ╲╱╲                                       │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌──────────────────────┐ ┌──────────────────────┐                 │
│ │ Top Paths            │ │ Top Referrers        │                 │
│ │ 1. /posts/foo  120   │ │ 1. google.com   80   │                 │
│ │ 2. /about       60   │ │ 2. twitter.com  30   │                 │
│ │ 3. /tags        45   │ │ 3. hn           12   │                 │
│ └──────────────────────┘ └──────────────────────┘                 │
│                                                                    │
│ ┌──────────────────────┐ ┌──────────────────────┐                 │
│ │ Devices              │ │ Browsers             │                 │
│ │ desktop ████████ 80% │ │ Chrome  ████████ 70% │                 │
│ │ mobile  ██       20% │ │ Safari  ███      25% │                 │
│ │ tablet  ▌         2% │ │ Firefox ▌         5% │                 │
│ └──────────────────────┘ └──────────────────────┘                 │
└────────────────────────────────────────────────────────────────────┘
```

## Query skeleton（getViewSummary）

```ts
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export type AnalyticsRange = "today" | "7d" | "30d" | "all"

function rangeToDate(range: AnalyticsRange): Date | null {
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000
  switch (range) {
    case "today": return new Date(now - 1 * DAY)
    case "7d":    return new Date(now - 7 * DAY)
    case "30d":   return new Date(now - 30 * DAY)
    case "all":   return null
  }
}

const PUBLIC_PATH_WHERE = {
  AND: [
    { NOT: { path: { startsWith: "/admin" } } },
    { NOT: { path: { startsWith: "/api" } } },
  ],
} as const

export async function getViewSummary(range: AnalyticsRange) {
  const since = rangeToDate(range)
  const where: Prisma.PageViewWhereInput = {
    ...(since ? { createdAt: { gte: since } } : {}),
    ...PUBLIC_PATH_WHERE,
  }

  const [total, uniqueRows, perDayRaw] = await Promise.all([
    db.pageView.count({ where }),
    db.pageView.findMany({
      where,
      select: { visitorHash: true },
      distinct: ["visitorHash"],
    }),
    db.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS date, COUNT(*)::bigint AS count
      FROM "PageView"
      WHERE ${since ? Prisma.sql`"createdAt" >= ${since} AND` : Prisma.empty}
        "path" NOT LIKE '/admin%'
        AND "path" NOT LIKE '/api%'
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY date ASC
      LIMIT 30
    `,
  ])

  // fill missing days
  const perDay = fillMissingDays(perDayRaw, since)

  return { total, unique: uniqueRows.length, perDay }
}

function fillMissingDays(
  rows: Array<{ date: Date; count: bigint }>,
  since: Date | null,
): Array<{ date: string; count: number }> {
  if (rows.length === 0) return []
  const start = since ?? rows[0].date
  const end = new Date()
  const result: Array<{ date: string; count: number }> = []
  const cur = new Date(start)
  cur.setUTCHours(0, 0, 0, 0)
  end.setUTCHours(0, 0, 0, 0)
  while (cur <= end) {
    const iso = cur.toISOString().slice(0, 10)
    const found = rows.find(r => r.date.toISOString().slice(0, 10) === iso)
    result.push({ date: iso, count: Number(found?.count ?? 0) })
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return result.slice(-30)
}
```

## getTopPaths skeleton

```ts
export async function getTopPaths(range: AnalyticsRange, limit = 10) {
  const since = rangeToDate(range)
  const where: Prisma.PageViewWhereInput = {
    ...(since ? { createdAt: { gte: since } } : {}),
    ...PUBLIC_PATH_WHERE,
  }

  const rows = await db.pageView.groupBy({
    by: ["path"],
    where,
    _count: { _all: true },
    orderBy: { _count: { path: "desc" } },
    take: limit,
  })

  return rows.map(r => ({ path: r.path, count: r._count._all }))
}
```

## getDeviceDistribution skeleton

```ts
export async function getDeviceDistribution(range: AnalyticsRange) {
  const since = rangeToDate(range)
  const where: Prisma.PageViewWhereInput = since ? { createdAt: { gte: since } } : {}

  const rows = await db.pageView.groupBy({
    by: ["device"],
    where,
    _count: { _all: true },
    orderBy: { _count: { device: "desc" } },
  })

  return rows.map(r => ({ device: r.device ?? "unknown", count: r._count._all }))
}
```

## Locked decisions

R1-R10 详 proposal。重申：
- **零 chart 依赖** — SVG inline (R1)
- **`$queryRaw` 只用 perDay trend，其它 groupBy** (R2)
- **admin 风** — sans / shadcn Card / 不复用 Editorial tokens (R8)
- **widget-level fallback** — safe() helper (R9)
- **range 用 zod enum + default** — searchParams (R7)

## Anti-template / quality

- [x] 真数字 + 真分布（不是 placeholder skeleton）
- [x] empty state per widget
- [x] failure state per widget
- [x] semantic headings
- [x] keyboard accessible range selector (Links are focusable)
- [x] dark mode via existing CSS vars

## 不要做的事

- 不装 recharts / chart.js / nivo / d3
- 不实现 live polling / WebSocket
- 不加 geo / IP geocoding
- 不实现 export CSV
- 不改 PageView schema
- 不改 recordPageView 行为
- 不加 client component（全 RSC）
