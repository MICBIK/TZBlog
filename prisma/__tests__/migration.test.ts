import { execFileSync } from "node:child_process"

import { describe, expect, it } from "vitest"

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
