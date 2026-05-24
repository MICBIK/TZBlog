import { describe, expect, it } from "vitest"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { pathToFileURL } from "node:url"

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

  it("insertArticleMetadataStoresJsonbCorrectly", async () => {
    const schemaModulePath = join(
      process.cwd(),
      "src/lib/schemas/entryMetadata.ts",
    )
    expect(existsSync(schemaModulePath)).toBe(true)

    const { parseEntryMetadata } = (await import(
      pathToFileURL(schemaModulePath).href
    )) as {
      parseEntryMetadata: (
        kind: "ARTICLE",
        raw: unknown,
      ) => { data: { cover?: string; readingMinutes?: number; toc: boolean } }
    }

    const suffix = Date.now().toString(36)
    const authorId = await ensureTestUser(`schema-meta-${suffix}@tzblog.local`)
    const channel = await testDb.channel.create({
      data: {
        slug: `schema-meta-channel-${suffix}`,
        kind: "ARTICLES",
        layout: "CHRONICLE",
        translations: { create: { locale: "zh", name: "Meta Channel" } },
      },
    })

    await testDb.entry.create({
      data: {
        slug: `schema-meta-entry-${suffix}`,
        channelId: channel.id,
        authorId,
        kind: "ARTICLE",
        status: "PUBLISHED",
        body: "metadata body",
        metadata: {
          cover: "/showcase/meta.png",
          readingMinutes: 5,
          toc: false,
        },
        translations: {
          create: { locale: "zh", title: "Metadata Entry" },
        },
      },
    })

    const found = await testDb.entry.findUniqueOrThrow({
      where: { slug: `schema-meta-entry-${suffix}` },
      select: { kind: true, metadata: true },
    })
    const parsed = parseEntryMetadata("ARTICLE", found.metadata)

    expect(parsed.data.cover).toBe("/showcase/meta.png")
    expect(parsed.data.readingMinutes).toBe(5)
    expect(parsed.data.toc).toBe(false)
  })

  it("insertGuestbookChannelAllowsGuestbookThreadEntry", async () => {
    const rulesModulePath = join(
      process.cwd(),
      "src/lib/schemas/channelEntryRules.ts",
    )
    expect(existsSync(rulesModulePath)).toBe(true)

    const { getAllowedEntryKindsForChannelKind } = (await import(
      pathToFileURL(rulesModulePath).href
    )) as {
      getAllowedEntryKindsForChannelKind: (
        kind: "GUESTBOOK",
      ) => ReadonlyArray<string>
    }
    expect(getAllowedEntryKindsForChannelKind("GUESTBOOK")).toEqual([
      "GUESTBOOK_THREAD",
    ])

    const suffix = Date.now().toString(36)
    const authorId = await ensureTestUser(
      `schema-guestbook-${suffix}@tzblog.local`,
    )
    const channel = await testDb.channel.create({
      data: {
        slug: `schema-guestbook-${suffix}`,
        kind: "GUESTBOOK",
        layout: "FEED",
        enabled: false,
        translations: { create: { locale: "zh", name: "Guestbook" } },
      },
    })

    const entry = await testDb.entry.create({
      data: {
        slug: `schema-guestbook-thread-${suffix}`,
        channelId: channel.id,
        authorId,
        kind: "GUESTBOOK_THREAD",
        status: "PUBLISHED",
        body: "第一条私密留言",
        metadata: {
          visitorName: "Schema Visitor",
          visibility: "PRIVATE_TO_AUTHOR",
        },
        translations: {
          create: { locale: "zh", title: "Schema Visitor" },
        },
      },
      include: { channel: true },
    })

    expect(entry.channel.kind).toBe("GUESTBOOK")
    expect(entry.kind).toBe("GUESTBOOK_THREAD")
  })

  it("deleteChannelCascadesToEntriesTranslationsSeries", async () => {
    const channelsServicePath = join(
      process.cwd(),
      "src/lib/services/channels.ts",
    )
    expect(existsSync(channelsServicePath)).toBe(true)

    const { deleteChannel } = (await import(
      pathToFileURL(channelsServicePath).href
    )) as { deleteChannel: (id: string) => Promise<void> }

    const suffix = Date.now().toString(36)
    const authorId = await ensureTestUser(
      `schema-cascade-${suffix}@tzblog.local`,
    )
    const channel = await testDb.channel.create({
      data: {
        slug: `schema-cascade-${suffix}`,
        kind: "ARTICLES",
        layout: "CHRONICLE",
        translations: { create: { locale: "zh", name: "Cascade" } },
      },
    })
    const series = await testDb.series.create({
      data: {
        slug: `schema-series-${suffix}`,
        channelId: channel.id,
        translations: { create: { locale: "zh", name: "Series" } },
      },
    })
    const entry = await testDb.entry.create({
      data: {
        slug: `schema-cascade-entry-${suffix}`,
        channelId: channel.id,
        authorId,
        kind: "ARTICLE",
        status: "PUBLISHED",
        body: "cascade body",
        seriesId: series.id,
        seriesOrder: 1,
        translations: { create: { locale: "zh", title: "Cascade Entry" } },
        views: {
          create: { visitorHash: `vh-${suffix}`, dayKey: "2026-05-25" },
        },
        likes: {
          create: { visitorHash: `vh-${suffix}` },
        },
        comments: {
          create: {
            authorName: "Visitor",
            authorEmail: "visitor@example.com",
            content: "comment",
            status: "APPROVED",
            visibility: "PUBLIC",
            visitorHash: `vh-${suffix}`,
            ipAddress: "127.0.0.1",
            userAgent: "vitest",
          },
        },
      },
    })

    await deleteChannel(channel.id)

    await expect(
      testDb.channel.findUnique({ where: { id: channel.id } }),
    ).resolves.toBeNull()
    await expect(
      testDb.channelTranslation.count({ where: { channelId: channel.id } }),
    ).resolves.toBe(0)
    await expect(
      testDb.entry.count({ where: { id: entry.id } }),
    ).resolves.toBe(0)
    await expect(
      testDb.entryTranslation.count({ where: { entryId: entry.id } }),
    ).resolves.toBe(0)
    await expect(
      testDb.series.count({ where: { id: series.id } }),
    ).resolves.toBe(0)
    await expect(
      testDb.seriesTranslation.count({ where: { seriesId: series.id } }),
    ).resolves.toBe(0)
    await expect(
      testDb.entryView.count({ where: { entryId: entry.id } }),
    ).resolves.toBe(0)
    await expect(
      testDb.entryLike.count({ where: { entryId: entry.id } }),
    ).resolves.toBe(0)
    await expect(
      testDb.comment.count({ where: { entryId: entry.id } }),
    ).resolves.toBe(0)
  })

  it("seriesIndexAllowsSeriesOrderQuery", async () => {
    const seriesServicePath = join(
      process.cwd(),
      "src/lib/services/series.ts",
    )
    expect(existsSync(seriesServicePath)).toBe(true)

    const { listSeriesEntries } = (await import(
      pathToFileURL(seriesServicePath).href
    )) as {
      listSeriesEntries: (
        seriesId: string,
      ) => Promise<Array<{ slug: string; seriesOrder: number | null }>>
    }

    const suffix = Date.now().toString(36)
    const authorId = await ensureTestUser(`schema-series-${suffix}@tzblog.local`)
    const channel = await testDb.channel.create({
      data: {
        slug: `schema-series-channel-${suffix}`,
        kind: "ARTICLES",
        layout: "CHRONICLE",
        translations: { create: { locale: "zh", name: "Series Channel" } },
      },
    })
    const [targetSeries, otherSeries] = await Promise.all([
      testDb.series.create({
        data: {
          slug: `schema-target-series-${suffix}`,
          channelId: channel.id,
          translations: { create: { locale: "zh", name: "Target Series" } },
        },
      }),
      testDb.series.create({
        data: {
          slug: `schema-other-series-${suffix}`,
          channelId: channel.id,
          translations: { create: { locale: "zh", name: "Other Series" } },
        },
      }),
    ])

    await Promise.all([
      testDb.entry.create({
        data: {
          slug: `schema-series-entry-2-${suffix}`,
          channelId: channel.id,
          authorId,
          kind: "ARTICLE",
          status: "PUBLISHED",
          body: "second",
          seriesId: targetSeries.id,
          seriesOrder: 2,
          translations: { create: { locale: "zh", title: "Second" } },
        },
      }),
      testDb.entry.create({
        data: {
          slug: `schema-series-entry-1-${suffix}`,
          channelId: channel.id,
          authorId,
          kind: "ARTICLE",
          status: "PUBLISHED",
          body: "first",
          seriesId: targetSeries.id,
          seriesOrder: 1,
          translations: { create: { locale: "zh", title: "First" } },
        },
      }),
      testDb.entry.create({
        data: {
          slug: `schema-other-series-entry-${suffix}`,
          channelId: channel.id,
          authorId,
          kind: "ARTICLE",
          status: "PUBLISHED",
          body: "other",
          seriesId: otherSeries.id,
          seriesOrder: 1,
          translations: { create: { locale: "zh", title: "Other" } },
        },
      }),
    ])

    const entries = await listSeriesEntries(targetSeries.id)

    expect(entries.map((entry) => entry.slug)).toEqual([
      `schema-series-entry-1-${suffix}`,
      `schema-series-entry-2-${suffix}`,
    ])
    expect(entries.map((entry) => entry.seriesOrder)).toEqual([1, 2])
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
