import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

import { ensureTestUser, testDb } from "../../tests/helpers/db"

describe("Channel/Entry Prisma schema", () => {
  it("generatesPrismaClientWithNewTypes", () => {
    const delegates = testDb as unknown as Record<string, unknown>

    expect(delegates.channel).toBeDefined()
    expect(delegates.entry).toBeDefined()
    expect(delegates.series).toBeDefined()
    expect(delegates.rateLimitLog).toBeDefined()
  })

  it("typecheckPassesWithNoLegacyPostColumnReferences", () => {
    const root = join(process.cwd(), "src")
    const offenders: string[] = []

    for (const file of listSourceFiles(root)) {
      const source = readFileSync(file, "utf8")
      if (
        /\bdb\.(post|column|postLike|postView|tagsOnPosts|postTranslation|columnTranslation)\b/.test(
          source,
        )
      ) {
        offenders.push(relative(process.cwd(), file))
      }
    }

    expect(offenders).toEqual([])
  })

  it("entryFindFirstReturnsNestedChannelTagsTranslations", async () => {
    const suffix = Date.now().toString(36)
    const authorId = await ensureTestUser(`schema-${suffix}@tzblog.local`)
    const tag = await testDb.tag.upsert({
      where: { slug: `schema-${suffix}` },
      create: { slug: `schema-${suffix}`, name: "schema" },
      update: {},
    })

    const channel = await testDb.channel.create({
      data: {
        slug: `schema-channel-${suffix}`,
        kind: "ARTICLES",
        layout: "CHRONICLE",
        order: 1,
        translations: {
          create: {
            locale: "zh",
            name: "Schema Channel",
            description: "relation smoke",
          },
        },
      },
    })

    await testDb.entry.create({
      data: {
        slug: `schema-entry-${suffix}`,
        channelId: channel.id,
        authorId,
        kind: "ARTICLE",
        status: "PUBLISHED",
        publishedAt: new Date(),
        body: "# Schema Entry\n\nbody",
        metadata: { cover: "/showcase/schema.png", readingMinutes: 3 },
        translations: {
          create: {
            locale: "zh",
            title: "Schema Entry",
            excerpt: "nested relation check",
          },
        },
        tags: {
          create: {
            tagId: tag.id,
          },
        },
      },
    })

    const found = await testDb.entry.findFirst({
      where: { slug: `schema-entry-${suffix}` },
      include: {
        channel: { include: { translations: true } },
        tags: { include: { tag: true } },
        translations: true,
      },
    })

    expect(found?.channel.slug).toBe(`schema-channel-${suffix}`)
    expect(found?.channel.translations[0]?.name).toBe("Schema Channel")
    expect(found?.tags[0]?.tag.slug).toBe(`schema-${suffix}`)
    expect(found?.translations[0]?.title).toBe("Schema Entry")
  })
})

function listSourceFiles(dir: string): string[] {
  const result: string[] = []

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      result.push(...listSourceFiles(fullPath))
      continue
    }

    if (
      /\.(ts|tsx)$/.test(entry) &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".test.tsx")
    ) {
      result.push(fullPath)
    }
  }

  return result
}
