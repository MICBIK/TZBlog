# specs/components — analytics dashboard components

> spec-id 前缀：`SPEC-AN-C`

## SPEC-AN-C-1 — MetricCard renders big number + label + optional delta

```gherkin
GIVEN MetricCard({ label: "Views (7d)", value: 1234, delta: 12 })

WHEN render

THEN visible:
  - label "Views (7d)"
  - large number "1,234" (with comma formatter)
  - delta badge "+12%" (green if positive, red if negative)
  - if delta undefined → no badge

Test:
  render(<MetricCard label="Views (7d)" value={1234} delta={12} />)
  expect(getByText("Views (7d)")).toBeInTheDocument()
  expect(getByText(/1,234/)).toBeInTheDocument()
  expect(getByText(/12/)).toBeInTheDocument()
```

## SPEC-AN-C-2 — TopList renders ranked list

```gherkin
GIVEN TopList({ title: "Top Paths", items: [{ label: "/a", count: 10 }, { label: "/b", count: 5 }] })

WHEN render

THEN visible:
  - title heading
  - each item shows index (1, 2), label, count
  - if items empty → shows "No data" empty state

Test:
  render(<TopList title="Top Paths" items={[{ label: "/a", count: 10 }]} />)
  expect(getByText("Top Paths")).toBeInTheDocument()
  expect(getByText("/a")).toBeInTheDocument()
  expect(getByText("10")).toBeInTheDocument()
```

## SPEC-AN-C-3 — DistributionBar renders proportional bars

```gherkin
GIVEN DistributionBar({ title: "Devices", items: [{ label: "desktop", count: 80 }, { label: "mobile", count: 20 }] })

WHEN render

THEN visible:
  - title
  - each item shows label + count + a bar whose width is proportional to count/maxCount
  - bar styling uses CSS background

Test (assert width style):
  render(<DistributionBar title="Devices" items={[{ label: "desktop", count: 80 }, { label: "mobile", count: 20 }]} />)
  const bars = container.querySelectorAll("[data-testid='bar']")
  expect(bars[0]).toHaveStyle({ width: "100%" })  // desktop = max
  expect(bars[1]).toHaveStyle({ width: "25%" })   // mobile / 80 = 0.25
```

## SPEC-AN-C-4 — TrendChart renders SVG sparkline

```gherkin
GIVEN TrendChart({ data: [{ date: "2026-05-15", count: 10 }, { date: "2026-05-16", count: 20 }, { date: "2026-05-17", count: 15 }] })

WHEN render

THEN renders an inline SVG with:
  - <polyline> or <path> connecting data points
  - viewBox sized to container
  - currentColor stroke (theme-aware)
  - aria-label or <title> for a11y
  - if data empty → "No trend data" fallback

Test:
  render(<TrendChart data={mockData} />)
  expect(container.querySelector("svg")).toBeInTheDocument()
  expect(container.querySelector("svg polyline")).toBeInTheDocument()
```

## Components 共用 styling

- 用 admin shadcn Card / Tailwind utilities
- 不用 site 的 serif typography（admin = sans-only）
- 暗色模式适配（CSS vars）

## MetricCard skeleton

```tsx
type Props = {
  label: string
  value: number
  delta?: number  // percent
}

export function MetricCard({ label, value, delta }: Props) {
  const formatted = new Intl.NumberFormat("en-US").format(value)

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-2">
      <p className="text-sm text-muted-fg uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-3">
        <p className="text-4xl font-semibold tracking-tight text-fg">{formatted}</p>
        {delta !== undefined && (
          <span className={cn(
            "text-sm font-medium",
            delta >= 0 ? "text-emerald-600" : "text-red-600"
          )}>
            {delta >= 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>
    </div>
  )
}
```

## TrendChart skeleton (CSS-only SVG)

```tsx
type Props = {
  data: Array<{ date: string; count: number }>
  height?: number
}

export function TrendChart({ data, height = 80 }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-fg">No trend data</p>
  }

  const max = Math.max(...data.map(d => d.count), 1)
  const width = 600
  const stepX = width / Math.max(data.length - 1, 1)

  const points = data
    .map((d, i) => `${i * stepX},${height - (d.count / max) * height}`)
    .join(" ")

  return (
    <svg
      role="img"
      aria-label={`Trend chart over ${data.length} days`}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-20 text-fg"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
```
