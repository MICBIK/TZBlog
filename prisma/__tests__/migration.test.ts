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
