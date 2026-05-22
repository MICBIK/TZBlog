# specs/queries — analytics query functions

> spec-id 前缀：`SPEC-AN-Q`

## Range type

```ts
export type AnalyticsRange = "today" | "7d" | "30d" | "all"

function rangeToDate(range: AnalyticsRange): Date | null {
  const now = Date.now()
  switch (range) {
    case "today": return new Date(now - 1 * 24 * 60 * 60 * 1000)
    case "7d":    return new Date(now - 7 * 24 * 60 * 60 * 1000)
    case "30d":   return new Date(now - 30 * 24 * 60 * 60 * 1000)
    case "all":   return null
  }
}
```

## Common filter — exclude admin paths

```ts
const PUBLIC_PATH_FILTER = {
  AND: [
    { NOT: { path: { startsWith: "/admin" } } },
    { NOT: { path: { startsWith: "/api" } } },
  ],
}
```

## SPEC-AN-Q-1 — getViewSummary returns total + unique + perDay

```gherkin
GIVEN PageView rows seeded:
  - 5 rows in last 24h (3 unique visitorHash) on paths /a /b
  - 10 rows in last 7d total
  - mix of /admin/* (excluded) and / (included)

WHEN getViewSummary("7d")

THEN returns:
  {
    total: <count of last-7d public path views>,
    unique: <distinct visitorHash count in last 7d, public>,
    perDay: Array<{ date: "YYYY-MM-DD", count: number }>  // length up to 7
  }

AND perDay sorted ASC by date
AND days with 0 views are included as { date, count: 0 } (continuous range)
```

## SPEC-AN-Q-2 — getViewSummary supports "all" range

```gherkin
GIVEN range = "all"
WHEN getViewSummary("all")
THEN no date filter applied
AND perDay covers from earliest createdAt to today (capped at 30 entries to avoid runaway, optionally)
```

Decision: cap perDay at 30 most recent entries when range="all".

## SPEC-AN-Q-3 — getTopPaths returns top 10 by count

```gherkin
GIVEN PageView rows: /a (5), /b (3), /c (2), /admin/x (100, excluded)

WHEN getTopPaths("7d", 10)

THEN returns [
  { path: "/a", count: 5 },
  { path: "/b", count: 3 },
  { path: "/c", count: 2 },
]
AND result length ≤ limit
AND /admin/* excluded
```

## SPEC-AN-Q-4 — getTopReferrers returns non-null top 10

```gherkin
GIVEN PageView rows mix referrer null and referrer values

WHEN getTopReferrers("7d", 10)

THEN returns only rows with referrer != null, grouped + counted, sorted DESC
AND null referrers excluded entirely from list
```

## SPEC-AN-Q-5 — getDeviceDistribution returns device breakdown

```gherkin
GIVEN PageView rows with device values: "desktop" (10), "mobile" (5), null (2)

WHEN getDeviceDistribution("7d")

THEN returns [
  { device: "desktop", count: 10 },
  { device: "mobile", count: 5 },
  { device: "unknown", count: 2 },  // null mapped to "unknown"
]
AND sorted DESC by count
```

## SPEC-AN-Q-6 — getBrowserDistribution same shape

```gherkin
SAME as Q-5 but for browser column
```

## SPEC-AN-Q-7 — query functions handle empty result

```gherkin
GIVEN PageView table empty

WHEN any of the 5 query functions called

THEN returns sensible empty:
  - getViewSummary: { total: 0, unique: 0, perDay: [] }
  - getTopPaths / Referrers / DeviceDist / BrowserDist: []

AND no throw
```

## SQL hints for perDay trend

```ts
import { Prisma } from "@prisma/client"

const result = await db.$queryRaw<Array<{ date: Date; count: bigint }>>`
  SELECT date_trunc('day', "createdAt") AS date, COUNT(*)::bigint AS count
  FROM "PageView"
  WHERE "createdAt" >= ${since}
    AND "path" NOT LIKE '/admin%'
    AND "path" NOT LIKE '/api%'
  GROUP BY date_trunc('day', "createdAt")
  ORDER BY date ASC
`

// then bigint → number, fill missing days
```

Fill missing days in TS:
```ts
const filled: Array<{date: string, count: number}> = []
const start = since  // earliest date
const end = new Date()
for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const iso = d.toISOString().slice(0, 10)
  const found = result.find(r => r.date.toISOString().slice(0,10) === iso)
  filled.push({ date: iso, count: Number(found?.count ?? 0) })
}
```
