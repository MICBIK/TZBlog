import { describe, it, expect, beforeEach, afterAll } from "vitest"

import {
  resetAll,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"
import * as analytics from "./analytics"
import { recordPageView } from "./analytics"

type ViewSummary = {
  total: number
  unique: number
  perDay: Array<{ date: string; count: number }>
}

type AnalyticsExports = {
  getViewSummary: (range: "today" | "7d" | "30d" | "all") => Promise<ViewSummary>
  getTopPaths: (
    range: "today" | "7d" | "30d" | "all",
    limit?: number,
  ) => Promise<Array<{ path: string; count: number }>>
  getTopReferrers: (
    range: "today" | "7d" | "30d" | "all",
    limit?: number,
  ) => Promise<Array<{ referrer: string; count: number }>>
  getDeviceDistribution: (
    range: "today" | "7d" | "30d" | "all",
  ) => Promise<Array<{ device: string; count: number }>>
  getBrowserDistribution: (
    range: "today" | "7d" | "30d" | "all",
  ) => Promise<Array<{ browser: string; count: number }>>
}

const {
  getBrowserDistribution,
  getDeviceDistribution,
  getTopPaths,
  getTopReferrers,
  getViewSummary,
} = analytics as unknown as AnalyticsExports

beforeEach(async () => {
  await resetAll()
  // PageView 不在 resetAll 列表内（其无 FK 依赖），手动清空
  await testDb.pageView.deleteMany()
})

afterAll(async () => {
  await disconnectTestDb()
})

describe("recordPageView", () => {
  it("inserts a PageView row with parsed UA + referrer (SPEC-A-V-1)", async () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    const before = Date.now()
    await recordPageView({
      path: "/",
      visitorHash: "v1",
      ua,
      referrer: "https://google.com",
    })
    const after = Date.now()

    const all = await testDb.pageView.findMany()
    expect(all).toHaveLength(1)
    const row = all[0]
    expect(row.path).toBe("/")
    expect(row.visitorHash).toBe("v1")
    expect(row.userAgent).toBe(ua)
    expect(row.device).toBe("desktop")
    expect(row.browser).toBe("Chrome")
    expect(row.os).toBe("macOS")
    expect(row.referrer).toBe("https://google.com")
    expect(row.createdAt.getTime()).toBeGreaterThanOrEqual(before - 5000)
    expect(row.createdAt.getTime()).toBeLessThanOrEqual(after + 5000)
  })

  it("treats missing referrer as null (SPEC-A-V-2)", async () => {
    await recordPageView({
      path: "/posts/hi",
      visitorHash: "v2",
      ua: "Mozilla/5.0 (X11; Linux x86_64) Firefox/100",
    })

    const all = await testDb.pageView.findMany()
    expect(all).toHaveLength(1)
    expect(all[0].path).toBe("/posts/hi")
    expect(all[0].referrer).toBeNull()
    expect(all[0].browser).toBe("Firefox")
    expect(all[0].os).toBe("Linux")
  })

  it("treats empty-string referrer as null (alignment with form layer)", async () => {
    await recordPageView({
      path: "/about",
      visitorHash: "v3",
      ua: "UA",
      referrer: "",
    })

    const all = await testDb.pageView.findMany()
    expect(all).toHaveLength(1)
    expect(all[0].referrer).toBeNull()
  })
})

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS)
}

async function createPageView(input: {
  path: string
  visitorHash: string
  createdAt?: Date
  referrer?: string | null
  device?: string | null
  browser?: string | null
}): Promise<void> {
  await testDb.pageView.create({
    data: {
      path: input.path,
      visitorHash: input.visitorHash,
      userAgent: "UA",
      referrer: input.referrer ?? null,
      device: input.device ?? null,
      browser: input.browser ?? null,
      os: "test-os",
      createdAt: input.createdAt ?? new Date(),
    },
  })
}

async function createPageViews(
  count: number,
  input: Omit<Parameters<typeof createPageView>[0], "visitorHash"> & {
    visitorHashPrefix: string
  },
): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await createPageView({
      ...input,
      visitorHash: `${input.visitorHashPrefix}-${i}`,
    })
  }
}

describe("analytics dashboard query functions", () => {
  it("getViewSummary returns total + unique + perDay with continuous days", async () => {
    await createPageView({
      path: "/a",
      visitorHash: "same",
      createdAt: daysAgo(1),
    })
    await createPageView({
      path: "/b",
      visitorHash: "same",
      createdAt: daysAgo(1),
    })
    await createPageView({
      path: "/b",
      visitorHash: "unique-2",
      createdAt: daysAgo(3),
    })
    await createPageView({
      path: "/admin",
      visitorHash: "excluded-admin",
      createdAt: daysAgo(2),
    })
    await createPageView({
      path: "/api/track",
      visitorHash: "excluded-api",
      createdAt: daysAgo(2),
    })
    await createPageView({
      path: "/old",
      visitorHash: "old",
      createdAt: daysAgo(8),
    })

    const summary = await getViewSummary("7d")

    expect(summary.total).toBe(3)
    expect(summary.unique).toBe(2)
    expect(summary.perDay.length).toBeGreaterThanOrEqual(4)
    expect(summary.perDay.length).toBeLessThanOrEqual(7)
    expect(summary.perDay).toEqual(
      [...summary.perDay].sort((a, b) => a.date.localeCompare(b.date)),
    )
    expect(summary.perDay.some((day) => day.count === 0)).toBe(true)
  })

  it('getViewSummary supports "all" range capped at 30 entries', async () => {
    await createPageView({
      path: "/first",
      visitorHash: "first",
      createdAt: daysAgo(40),
    })
    await createPageView({
      path: "/recent",
      visitorHash: "recent",
      createdAt: daysAgo(1),
    })

    const summary = await getViewSummary("all")

    expect(summary.total).toBe(2)
    expect(summary.unique).toBe(2)
    expect(summary.perDay).toHaveLength(30)
    expect(summary.perDay.at(-1)?.date).toBe(new Date().toISOString().slice(0, 10))
  })

  it("getTopPaths returns top N excluding /admin and /api", async () => {
    await createPageViews(5, {
      path: "/a",
      visitorHashPrefix: "a",
      createdAt: daysAgo(1),
    })
    await createPageViews(3, {
      path: "/b",
      visitorHashPrefix: "b",
      createdAt: daysAgo(1),
    })
    await createPageViews(2, {
      path: "/c",
      visitorHashPrefix: "c",
      createdAt: daysAgo(1),
    })
    await createPageViews(100, {
      path: "/admin/posts",
      visitorHashPrefix: "admin",
      createdAt: daysAgo(1),
    })
    await createPageViews(100, {
      path: "/api/track",
      visitorHashPrefix: "api",
      createdAt: daysAgo(1),
    })

    await expect(getTopPaths("7d", 2)).resolves.toEqual([
      { path: "/a", count: 5 },
      { path: "/b", count: 3 },
    ])
  })

  it("getTopReferrers excludes null referrers", async () => {
    await createPageViews(3, {
      path: "/a",
      visitorHashPrefix: "google",
      referrer: "https://google.com",
      createdAt: daysAgo(1),
    })
    await createPageViews(2, {
      path: "/b",
      visitorHashPrefix: "hn",
      referrer: "https://news.ycombinator.com",
      createdAt: daysAgo(1),
    })
    await createPageView({
      path: "/c",
      visitorHash: "direct",
      referrer: null,
      createdAt: daysAgo(1),
    })

    await expect(getTopReferrers("7d", 10)).resolves.toEqual([
      { referrer: "https://google.com", count: 3 },
      { referrer: "https://news.ycombinator.com", count: 2 },
    ])
  })

  it("getDeviceDistribution returns sorted with null → unknown", async () => {
    await createPageViews(10, {
      path: "/a",
      visitorHashPrefix: "desktop",
      device: "desktop",
      createdAt: daysAgo(1),
    })
    await createPageViews(5, {
      path: "/b",
      visitorHashPrefix: "mobile",
      device: "mobile",
      createdAt: daysAgo(1),
    })
    await createPageViews(2, {
      path: "/c",
      visitorHashPrefix: "unknown",
      device: null,
      createdAt: daysAgo(1),
    })

    await expect(getDeviceDistribution("7d")).resolves.toEqual([
      { device: "desktop", count: 10 },
      { device: "mobile", count: 5 },
      { device: "unknown", count: 2 },
    ])
  })

  it("getBrowserDistribution same shape as devices", async () => {
    await createPageViews(4, {
      path: "/a",
      visitorHashPrefix: "chrome",
      browser: "Chrome",
      createdAt: daysAgo(1),
    })
    await createPageViews(2, {
      path: "/b",
      visitorHashPrefix: "safari",
      browser: "Safari",
      createdAt: daysAgo(1),
    })
    await createPageView({
      path: "/c",
      visitorHash: "unknown-browser",
      browser: null,
      createdAt: daysAgo(1),
    })

    await expect(getBrowserDistribution("7d")).resolves.toEqual([
      { browser: "Chrome", count: 4 },
      { browser: "Safari", count: 2 },
      { browser: "unknown", count: 1 },
    ])
  })

  it("all query functions return empty-safe on empty table", async () => {
    await expect(getViewSummary("7d")).resolves.toEqual({
      total: 0,
      unique: 0,
      perDay: [],
    })
    await expect(getTopPaths("7d")).resolves.toEqual([])
    await expect(getTopReferrers("7d")).resolves.toEqual([])
    await expect(getDeviceDistribution("7d")).resolves.toEqual([])
    await expect(getBrowserDistribution("7d")).resolves.toEqual([])
  })
})
