import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { parseUserAgent } from "@/lib/visitor"

/**
 * Analytics service — PageView 入库。
 *
 * recordPageView(input):
 *   - 用 parseUserAgent(ua) 拆 device / browser / os
 *   - insert PageView 行
 *   - 不去重（R11 决策），rate-limit 在 API 层兜底
 *
 * referrer 处理：空字符串与省略都归一化为 null（与 form 层 union 对齐）
 */

export interface RecordPageViewInput {
  path: string
  visitorHash: string
  ua: string
  referrer?: string
}

export type AnalyticsRange = "today" | "7d" | "30d" | "all"

export interface ViewSummary {
  total: number
  unique: number
  perDay: Array<{ date: string; count: number }>
}

export interface TopPath {
  path: string
  count: number
}

export interface TopReferrer {
  referrer: string
  count: number
}

export interface DeviceDistribution {
  device: string
  count: number
}

export interface BrowserDistribution {
  browser: string
  count: number
}

const DAY_MS = 24 * 60 * 60 * 1000

const RANGE_DAY_LIMIT: Record<AnalyticsRange, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  all: 30,
}

const PUBLIC_PATH_WHERE: Prisma.PageViewWhereInput = {
  AND: [
    { NOT: { path: { startsWith: "/admin" } } },
    { NOT: { path: { startsWith: "/api" } } },
  ],
}

const PUBLIC_PATH_SQL = Prisma.sql`
  "path" NOT LIKE '/admin%'
  AND "path" NOT LIKE '/api%'
`

export async function recordPageView(input: RecordPageViewInput): Promise<void> {
  const { device, browser, os } = parseUserAgent(input.ua)
  await db.pageView.create({
    data: {
      path: input.path,
      visitorHash: input.visitorHash,
      userAgent: input.ua,
      device,
      browser,
      os,
      referrer: input.referrer ? input.referrer : null,
    },
  })
}

export async function getViewSummary(
  range: AnalyticsRange,
): Promise<ViewSummary> {
  const since = rangeToDate(range)
  const where = getPublicPageViewWhere(range)
  const sinceSql = since
    ? Prisma.sql`"createdAt" >= ${since} AND`
    : Prisma.empty
  const orderSql = range === "all" ? Prisma.sql`DESC` : Prisma.sql`ASC`
  const limitSql = range === "all" ? Prisma.sql`LIMIT 30` : Prisma.empty

  const [total, uniqueRows, perDayRows] = await Promise.all([
    db.pageView.count({ where }),
    db.pageView.findMany({
      where,
      select: { visitorHash: true },
      distinct: ["visitorHash"],
    }),
    db.$queryRaw<Array<{ date: Date; count: bigint }>>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS date, COUNT(*)::bigint AS count
      FROM "PageView"
      WHERE ${sinceSql}
        ${PUBLIC_PATH_SQL}
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY date ${orderSql}
      ${limitSql}
    `),
  ])

  return {
    total,
    unique: uniqueRows.length,
    perDay: fillMissingDays(perDayRows, range, since),
  }
}

export async function getTopPaths(
  range: AnalyticsRange,
  limit = 10,
): Promise<TopPath[]> {
  const rows = await db.pageView.groupBy({
    by: ["path"],
    where: getPublicPageViewWhere(range),
    _count: { _all: true },
    orderBy: { _count: { path: "desc" } },
    take: normalizeLimit(limit),
  })

  return rows.map((row) => ({ path: row.path, count: row._count._all }))
}

export async function getTopReferrers(
  range: AnalyticsRange,
  limit = 10,
): Promise<TopReferrer[]> {
  const rows = await db.pageView.groupBy({
    by: ["referrer"],
    where: {
      ...getPublicPageViewWhere(range),
      referrer: { not: null },
    },
    _count: { _all: true },
    orderBy: { _count: { referrer: "desc" } },
    take: normalizeLimit(limit),
  })

  return rows.flatMap((row) =>
    row.referrer
      ? [{ referrer: row.referrer, count: row._count._all }]
      : [],
  )
}

export async function getDeviceDistribution(
  range: AnalyticsRange,
): Promise<DeviceDistribution[]> {
  const rows = await db.pageView.groupBy({
    by: ["device"],
    where: getPublicPageViewWhere(range),
    _count: { _all: true },
  })

  return rows
    .map((row) => ({
      device: row.device ?? "unknown",
      count: row._count._all,
    }))
    .sort(sortByCountDesc)
}

export async function getBrowserDistribution(
  range: AnalyticsRange,
): Promise<BrowserDistribution[]> {
  const rows = await db.pageView.groupBy({
    by: ["browser"],
    where: getPublicPageViewWhere(range),
    _count: { _all: true },
  })

  return rows
    .map((row) => ({
      browser: row.browser ?? "unknown",
      count: row._count._all,
    }))
    .sort(sortByCountDesc)
}

function rangeToDate(range: AnalyticsRange): Date | null {
  const now = Date.now()
  switch (range) {
    case "today":
      return new Date(now - DAY_MS)
    case "7d":
      return new Date(now - 7 * DAY_MS)
    case "30d":
      return new Date(now - 30 * DAY_MS)
    case "all":
      return null
  }
}

function getPublicPageViewWhere(
  range: AnalyticsRange,
): Prisma.PageViewWhereInput {
  const since = rangeToDate(range)
  return {
    ...(since ? { createdAt: { gte: since } } : {}),
    ...PUBLIC_PATH_WHERE,
  }
}

function fillMissingDays(
  rows: Array<{ date: Date; count: bigint }>,
  range: AnalyticsRange,
  since: Date | null,
): Array<{ date: string; count: number }> {
  if (rows.length === 0) return []

  const sortedRows = [...rows].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  )
  const countByDate = new Map(
    sortedRows.map((row) => [
      toIsoDate(row.date),
      Number(row.count),
    ]),
  )
  const start =
    range === "all"
      ? sortedRows[0].date
      : new Date(Date.now() - (RANGE_DAY_LIMIT[range] - 1) * DAY_MS)
  const end = new Date()
  const current = startOfUtcDay(since && range === "all" ? since : start)
  const last = startOfUtcDay(end)
  const result: Array<{ date: string; count: number }> = []

  while (current <= last) {
    const date = toIsoDate(current)
    result.push({ date, count: countByDate.get(date) ?? 0 })
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return result.slice(-RANGE_DAY_LIMIT[range])
}

function startOfUtcDay(date: Date): Date {
  const result = new Date(date)
  result.setUTCHours(0, 0, 0, 0)
  return result
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function normalizeLimit(limit: number): number {
  return Math.max(1, Math.min(Math.trunc(limit), 100))
}

function sortByCountDesc<T extends { count: number }>(a: T, b: T): number {
  return b.count - a.count
}
