# specs/page — `/admin` dashboard page composition

> spec-id 前缀：`SPEC-AN-P`

## SPEC-AN-P-1 — page renders all 7 widgets

```gherkin
GIVEN all 5 query functions mocked to return non-empty data

WHEN render(<AdminDashboardPage />)

THEN visible:
  - 3 MetricCard (today, 7d, 30d total views)
  - 2 TopList (Top Paths, Top Referrers)
  - 2 DistributionBar (Devices, Browsers)
  - 1 TrendChart (30d trend)
  - Range selector showing current range

Test (mock services):
  vi.mock("@/lib/services/analytics", ...)
  render(await AdminDashboardPage({ searchParams: Promise.resolve({}) }))
  expect(getAllByTestId("metric-card")).toHaveLength(3)
  expect(getByText("Top Paths")).toBeInTheDocument()
```

## SPEC-AN-P-2 — page reads range from searchParams

```gherkin
GIVEN searchParams.range = "30d"

WHEN render

THEN getViewSummary, getTopPaths, getTopReferrers, getDeviceDistribution, getBrowserDistribution all called with "30d"

AND if range absent → default "7d"

AND if range invalid → fallback "7d" (zod parse with default)
```

## SPEC-AN-P-3 — range selector renders 4 options as Links

```gherkin
GIVEN page renders

THEN range selector shows 4 buttons / Links: Today / 7d / 30d / All
AND clicking sets ?range=...
AND active option is visually distinguished
```

## SPEC-AN-P-4 — widget-level fallback on query failure

```gherkin
GIVEN getTopPaths throws (e.g., AppError("DB_ERROR"))

WHEN render

THEN that widget shows "Failed to load Top Paths" fallback
AND other widgets continue to render
AND page does not crash

Test:
  vi.mocked(getTopPaths).mockRejectedValue(new Error("DB"))
  ...render... 
  expect(getByText(/Failed to load Top Paths/)).toBeInTheDocument()
  expect(getAllByTestId("metric-card")).toHaveLength(3)  // others fine
```

Implementation pattern: each widget wrapped in helper:

```ts
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    console.warn("[dashboard widget] failed", err)
    return { ok: false, error: err instanceof Error ? err.message : "unknown" }
  }
}
```

## Page skeleton

```tsx
import { z } from "zod"
import {
  getViewSummary,
  getTopPaths,
  getTopReferrers,
  getDeviceDistribution,
  getBrowserDistribution,
} from "@/lib/services/analytics"
import { MetricCard } from "@/components/admin/analytics/MetricCard"
import { TopList } from "@/components/admin/analytics/TopList"
import { DistributionBar } from "@/components/admin/analytics/DistributionBar"
import { TrendChart } from "@/components/admin/analytics/TrendChart"
import { auth } from "@/lib/auth"
import Link from "next/link"

const rangeSchema = z.enum(["today", "7d", "30d", "all"]).default("7d")

type Props = {
  searchParams: Promise<{ range?: string }>
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const sp = await searchParams
  const range = rangeSchema.parse(sp.range ?? "7d")

  // Parallel data load with widget-level fallback
  const [summary, todaySummary, monthSummary, topPaths, topReferrers, devices, browsers] = await Promise.all([
    safe(() => getViewSummary(range), { total: 0, unique: 0, perDay: [] }),
    safe(() => getViewSummary("today"), { total: 0, unique: 0, perDay: [] }),
    safe(() => getViewSummary("30d"), { total: 0, unique: 0, perDay: [] }),
    safe(() => getTopPaths(range, 10), []),
    safe(() => getTopReferrers(range, 10), []),
    safe(() => getDeviceDistribution(range), []),
    safe(() => getBrowserDistribution(range), []),
  ])

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <RangeSelector current={range} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Today" value={todaySummary.ok ? todaySummary.data.total : 0} />
        <MetricCard label="Last 7 days" value={summary.ok ? summary.data.total : 0} />
        <MetricCard label="Last 30 days" value={monthSummary.ok ? monthSummary.data.total : 0} />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-muted-fg mb-3">Trend</h2>
        <TrendChart data={summary.ok ? summary.data.perDay : []} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {topPaths.ok ? <TopList title="Top Paths" items={topPaths.data.map(p => ({ label: p.path, count: p.count }))} /> : <FailedWidget name="Top Paths" />}
        {topReferrers.ok ? <TopList title="Top Referrers" items={topReferrers.data.map(p => ({ label: p.referrer, count: p.count }))} /> : <FailedWidget name="Top Referrers" />}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {devices.ok ? <DistributionBar title="Devices" items={devices.data.map(d => ({ label: d.device, count: d.count }))} /> : <FailedWidget name="Devices" />}
        {browsers.ok ? <DistributionBar title="Browsers" items={browsers.data.map(d => ({ label: d.browser, count: d.count }))} /> : <FailedWidget name="Browsers" />}
      </section>
    </div>
  )
}

function RangeSelector({ current }: { current: string }) {
  const options = ["today", "7d", "30d", "all"] as const
  return (
    <nav className="flex gap-1">
      {options.map(opt => (
        <Link
          key={opt}
          href={`?range=${opt}`}
          className={cn(
            "px-3 py-1 text-sm rounded border",
            opt === current ? "border-fg bg-fg text-bg" : "border-border hover:border-fg/40"
          )}
        >
          {opt}
        </Link>
      ))}
    </nav>
  )
}

function FailedWidget({ name }: { name: string }) {
  return <div className="rounded-lg border border-border p-4 text-sm text-muted-fg">Failed to load {name}</div>
}
```
