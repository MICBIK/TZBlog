import { execFileSync } from "node:child_process"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import type { ReactElement, ReactNode } from "react"
import { isValidElement } from "react"

import { describe, expect, it, vi } from "vitest"

import { testDb } from "../../tests/helpers/db"

const oldTables: string[] = [
  "Column",
  "ColumnTranslation",
  "Post",
  "PostTranslation",
  "TagsOnPosts",
  "PostView",
  "PostLike",
]

const newTables: string[] = [
  "Channel",
  "ChannelTranslation",
  "Entry",
  "EntryTranslation",
  "Series",
  "SeriesTranslation",
  "TagsOnEntries",
  "EntryView",
  "EntryLike",
  "RateLimitLog",
]

describe("Channel/Entry destructive migration", () => {
  it("oldTablesDroppedAndNewTablesCreatedEmpty", async () => {
    const existingTables = await listPublicTables()

    expect(existingTables).not.toEqual(expect.arrayContaining(oldTables))
    expect(existingTables).toEqual(expect.arrayContaining(newTables))
  })

  it("seedCreatesAdminChannelsAndEntryKindCoverage", async () => {
    execFileSync("pnpm", ["db:seed"], {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    const adminCount = await testDb.user.count({
      where: { role: "ADMIN" },
    })
    const channels = await testDb.channel.findMany({
      orderBy: { order: "asc" },
      select: { kind: true, slug: true },
    })
    const entryKindRows = await testDb.entry.groupBy({
      by: ["kind"],
      _count: { _all: true },
    })

    expect(adminCount).toBeGreaterThanOrEqual(1)
    expect(channels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "ARTICLES" }),
        expect.objectContaining({ kind: "STREAM" }),
        expect.objectContaining({ kind: "GUESTBOOK" }),
      ]),
    )
    expect(channels.length).toBeGreaterThanOrEqual(3)
    expect(
      entryKindRows.reduce(
        (sum, row) => sum + row._count._all,
        0,
      ),
    ).toBeGreaterThanOrEqual(8)
    expect(entryKindRows.map((row) => row.kind)).toEqual(
      expect.arrayContaining([
        "ARTICLE",
        "NOTE",
        "LINK",
        "JOKE",
        "HOT_TAKE",
        "QUOTE",
        "REVIEW",
      ]),
    )
  })

  it("seededArticleDetailPageRendersArticle", async () => {
    execFileSync("pnpm", ["db:seed"], {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    const PostDetailPage = await loadPostDetailPage()
    const element = await PostDetailPage({
      params: Promise.resolve({ slug: "why-i-rewrote-my-blog" }),
    })

    const text = collectText(element)
    expect(text).toContain("为什么我重做了自己的博客")
    expect(text).toContain("从 4 板块到 Channel/Entry 元模型的重构记录")
  })

  it("seededStreamChannelPageRendersGrepLayout", async () => {
    execFileSync("pnpm", ["db:seed"], {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    const ChannelDetailPage = await loadChannelDetailPage()
    const element = await ChannelDetailPage({
      params: Promise.resolve({ slug: "stream" }),
    })

    const text = collectText(element)
    expect(text).toContain("日志流")
    expect(text).toContain("grep my mind")
    expect(text).toContain("Reading Postgres Locks")
    expect(hasPropValue(element, "data-channel-layout", "GREP")).toBe(true)
  })

  it("guestbookPageShowsMagicLinkFormForAnonymousVisitor", async () => {
    execFileSync("pnpm", ["db:seed"], {
      cwd: process.cwd(),
      stdio: "pipe",
    })

    const GuestbookPage = await loadGuestbookPage()
    const element = await GuestbookPage()

    const text = collectText(element)
    expect(text).toContain("留言板")
    expect(text).toContain("邮箱")
    expect(text).toContain("发送登录链接")
    expect(hasPropValue(element, "data-guestbook-auth", "magic-link")).toBe(true)
  })

  it("prismaMigrateStatusReportsUpToDate", async () => {
    const { assertMigrationStatusUpToDate } = await loadMigrationStatus()

    const output = assertMigrationStatusUpToDate()

    expect(output).toContain("Database schema is up to date")
  })

  it("rateLimitLogProbeInsertsOneRow", async () => {
    const { insertRateLimitLogProbe } = await loadRateLimitLogProbe()

    const count = await insertRateLimitLogProbe({
      scope: "migration:mig-008",
      key: `probe-${Date.now()}`,
    })

    expect(count).toBe(1)
  })
})

async function listPublicTables(): Promise<string[]> {
  const rows = await testDb.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC
  `

  return rows.map((row) => row.table_name)
}

async function loadPostDetailPage(): Promise<
  (props: { params: Promise<{ slug: string }> }) => Promise<ReactNode>
> {
  vi.doMock("next/navigation", () => ({
    notFound: () => {
      throw new Error("not found")
    },
  }))
  vi.doMock("@/lib/markdown", () => ({
    extractToc: vi.fn().mockResolvedValue([]),
    renderMarkdown: vi.fn().mockResolvedValue("<p>article body</p>"),
  }))
  vi.doMock("@/components/site/PostViewBeacon", () => ({
    PostViewBeacon: () => null,
  }))
  vi.doMock("@/components/site/LikeButton", () => ({
    LikeButton: () => null,
  }))
  vi.doMock("@/components/site/CommentSection", () => ({
    CommentSection: () => null,
  }))
  vi.doMock("@/components/markdown/MarkdownCopyButtons", () => ({
    MarkdownCopyButtons: () => null,
  }))

  const pagePath = join(
    process.cwd(),
    "src/app/(site)/posts/[slug]/page.tsx",
  )
  const pageModule = (await import(pathToFileURL(pagePath).href)) as {
    default: (props: {
      params: Promise<{ slug: string }>
    }) => Promise<ReactNode>
  }
  return pageModule.default
}

async function loadChannelDetailPage(): Promise<
  (props: { params: Promise<{ slug: string }> }) => Promise<ReactNode>
> {
  vi.doMock("next/navigation", () => ({
    notFound: () => {
      throw new Error("not found")
    },
  }))

  const pagePath = join(process.cwd(), "src/app/(site)/c/[slug]/page.tsx")
  const pageModule = (await import(pathToFileURL(pagePath).href)) as {
    default: (props: {
      params: Promise<{ slug: string }>
    }) => Promise<ReactNode>
  }
  return pageModule.default
}

async function loadGuestbookPage(): Promise<() => Promise<ReactNode>> {
  const pagePath = join(process.cwd(), "src/app/(site)/guestbook/page.tsx")
  const pageModule = (await import(pathToFileURL(pagePath).href)) as {
    default: () => Promise<ReactNode>
  }
  return pageModule.default
}

async function loadMigrationStatus(): Promise<{
  assertMigrationStatusUpToDate: () => string
}> {
  const modulePath = join(process.cwd(), "src/lib/migrations/status.ts")
  return import(pathToFileURL(modulePath).href) as Promise<{
    assertMigrationStatusUpToDate: () => string
  }>
}

async function loadRateLimitLogProbe(): Promise<{
  insertRateLimitLogProbe: (input: {
    scope: string
    key: string
  }) => Promise<number>
}> {
  const modulePath = join(process.cwd(), "src/lib/security/rateLimitLog.ts")
  return import(pathToFileURL(modulePath).href) as Promise<{
    insertRateLimitLogProbe: (input: {
      scope: string
      key: string
    }) => Promise<number>
  }>
}

function collectText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return ""
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(collectText).join(" ")
  }
  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>
    return collectText(element.props.children)
  }
  return ""
}

function hasPropValue(
  node: ReactNode,
  propName: string,
  expected: string,
): boolean {
  if (node === null || node === undefined || typeof node === "boolean") {
    return false
  }
  if (typeof node === "string" || typeof node === "number") {
    return false
  }
  if (Array.isArray(node)) {
    return node.some((child) => hasPropValue(child, propName, expected))
  }
  if (isValidElement(node)) {
    const element = node as ReactElement<
      Record<string, unknown> & { children?: ReactNode }
    >
    if (element.props[propName] === expected) return true
    return hasPropValue(element.props.children, propName, expected)
  }
  return false
}
