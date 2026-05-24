import Link from "next/link"
import { z } from "zod"

import { DistributionBar } from "@/components/admin/DistributionBar"
import { MetricCard } from "@/components/admin/MetricCard"
import { TopList } from "@/components/admin/TopList"
import { TrendChart } from "@/components/admin/TrendChart"
import {
  getBrowserDistribution,
  getDeviceDistribution,
  getTopPaths,
  getTopReferrers,
  getViewSummary,
  type AnalyticsRange,
  type ViewSummary,
} from "@/lib/services/analytics"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const revalidate = 60

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type SafeResult<T> = { ok: true; data: T } | { ok: false }

const rangeSchema = z.enum(["today", "7d", "30d", "all"]).catch("7d")

const RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "today", label: "今天" },
  { value: "7d", label: "7 天" },
  { value: "30d", label: "30 天" },
  { value: "all", label: "全部" },
]

export default async function AdminDashboardPage({ searchParams }: Props) {
  const params = await searchParams
  const range = parseRange(params.range)

  const [
    todaySummary,
    sevenDaySummary,
    monthSummary,
    trendSummary,
    topPaths,
    topReferrers,
    devices,
    browsers,
  ] = await Promise.all([
    safe("今日", () => getViewSummary("today")),
    safe("近 7 天", () => getViewSummary("7d")),
    safe("近 30 天", () => getViewSummary("30d")),
    safe("访问趋势", () => getViewSummary(range)),
    safe("热门路径", () => getTopPaths(range, 10)),
    safe("来源页面", () => getTopReferrers(range, 10)),
    safe("设备分布", () => getDeviceDistribution(range)),
    safe("浏览器分布", () => getBrowserDistribution(range)),
  ])

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            仪表盘
          </h1>
          <p className="mt-1 text-sm text-muted-fg">
            公开访问数据概览，每 60 秒刷新一次。
          </p>
        </div>
        <RangeSelector current={range} />
      </header>

      <section
        aria-label="流量统计总览"
        className="grid gap-4 md:grid-cols-3"
      >
        <MetricWidget label="今日" result={todaySummary} />
        <MetricWidget label="近 7 天" result={sevenDaySummary} />
        <MetricWidget label="近 30 天" result={monthSummary} />
      </section>

      {trendSummary.ok ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">访问趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendSummary.data.perDay} />
          </CardContent>
        </Card>
      ) : (
        <FailedWidget name="访问趋势" />
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        {topPaths.ok ? (
          <TopList
            title="热门路径"
            items={topPaths.data.map((item) => ({
              label: item.path,
              count: item.count,
            }))}
          />
        ) : (
          <FailedWidget name="热门路径" />
        )}
        {topReferrers.ok ? (
          <TopList
            title="来源页面"
            items={topReferrers.data.map((item) => ({
              label: item.referrer,
              count: item.count,
            }))}
          />
        ) : (
          <FailedWidget name="来源页面" />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {devices.ok ? (
          <DistributionBar
            title="设备分布"
            items={devices.data.map((item) => ({
              label: item.device,
              count: item.count,
            }))}
          />
        ) : (
          <FailedWidget name="设备分布" />
        )}
        {browsers.ok ? (
          <DistributionBar
            title="浏览器分布"
            items={browsers.data.map((item) => ({
              label: item.browser,
              count: item.count,
            }))}
          />
        ) : (
          <FailedWidget name="浏览器分布" />
        )}
      </section>
    </div>
  )
}

function MetricWidget({
  label,
  result,
}: {
  label: string
  result: SafeResult<ViewSummary>
}) {
  return result.ok ? (
    <MetricCard label={label} value={result.data.total} />
  ) : (
    <FailedWidget name={label} />
  )
}

function RangeSelector({ current }: { current: AnalyticsRange }) {
  return (
    <nav aria-label="数据范围" className="flex flex-wrap gap-2">
      {RANGE_OPTIONS.map((option) => {
        const isActive = option.value === current
        return (
          <Link
            key={option.value}
            href={`/admin?range=${option.value}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-fg bg-fg text-bg"
                : "border-border text-muted-fg hover:bg-muted hover:text-fg",
            )}
          >
            {option.label}
          </Link>
        )
      })}
    </nav>
  )
}

function FailedWidget({ name }: { name: string }) {
  return (
    <Card role="alert">
      <CardContent className="p-6 text-sm text-muted-fg">
        加载失败：{name}
      </CardContent>
    </Card>
  )
}

async function safe<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<SafeResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    console.warn(`[admin dashboard] failed to load ${name}`, err)
    return { ok: false }
  }
}

function parseRange(value: string | string[] | undefined): AnalyticsRange {
  const raw = Array.isArray(value) ? value[0] : value
  return rangeSchema.parse(raw ?? "7d")
}
