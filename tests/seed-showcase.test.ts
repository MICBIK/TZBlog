import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { promisify } from "node:util"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "./helpers/db"

const execFileAsync = promisify(execFile)

beforeEach(async () => {
  await resetAll()
  await testDb.siteConfig.deleteMany()
  await ensureTestUser("admin@example.com")
})

afterAll(async () => {
  await disconnectTestDb()
})

describe("showcase seed", () => {
  it("seedsDeterministicShowcaseContent", async () => {
    await runSeed()
    await runSeed()

    const [entries, channels, tags, comments, config] = await Promise.all([
      testDb.entry.findMany({
        where: { status: "PUBLISHED" },
        include: {
          translations: true,
          channel: { include: { translations: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { slug: "asc" },
      }),
      testDb.channel.findMany({ include: { translations: true } }),
      testDb.tag.findMany({ orderBy: { slug: "asc" } }),
      testDb.comment.findMany({ where: { status: "APPROVED" } }),
      testDb.siteConfig.findUnique({ where: { id: "singleton" } }),
    ])

    expect(config?.metadata).toMatchObject({
      title: "TZBlog",
      description: expect.stringContaining("技术博客"),
    })
    expect(entries.length).toBeGreaterThanOrEqual(8)
    expect(channels).toHaveLength(6)
    expect(tags.length).toBeGreaterThanOrEqual(12)
    expect(comments.length).toBeGreaterThanOrEqual(2)

    for (const entry of entries) {
      expect(entry.publishedAt).toBeInstanceOf(Date)
      expect(entry.translations).toHaveLength(1)
      expect(entry.translations[0].locale).toBe("zh")
      expect(entry.translations[0].title).not.toEqual("(untitled)")
      expect(entry.channel?.translations[0]?.name).toBeTruthy()
      expect(entry.tags.length).toBeGreaterThanOrEqual(1)
    }

    const articleEntries = entries.filter((entry) =>
      [
        "notion-like-markdown-workflow",
        "self-hosted-nextjs-observability",
        "why-i-rewrote-my-blog",
      ].includes(entry.slug),
    )
    for (const entry of articleEntries) {
      expect(entry.body).toContain("```ts")
      expect(entry.body).toContain("![](/showcase/article-")
    }

    expect(entries.map((entry) => entry.slug)).toEqual(
      expect.arrayContaining([
        "hot-take-2026-05-22",
        "joke-bom-prod",
        "link-postgres-locks",
        "note-2026-05-23",
        "notion-like-markdown-workflow",
        "quote-didion",
        "self-hosted-nextjs-observability",
        "why-i-rewrote-my-blog",
      ]),
    )
  })

  it("seededContentSupportsPublicShowcaseRoutes", async () => {
    await runSeed()

    const latestEntry = await testDb.entry.findUnique({
      where: { slug: "self-hosted-nextjs-observability" },
      include: {
        translations: true,
        channel: { include: { translations: true } },
        tags: { include: { tag: true } },
        comments: { where: { status: "APPROVED" } },
      },
    })
    const channels = await testDb.channel.findMany({
      include: {
        translations: true,
        entries: { where: { status: "PUBLISHED" }, select: { id: true } },
      },
    })
    const tags = await testDb.tag.findMany({
      include: {
        entries: {
          where: { entry: { status: "PUBLISHED" } },
          select: { entryId: true },
        },
      },
    })

    expect(latestEntry?.slug).toBe("self-hosted-nextjs-observability")
    expect(latestEntry?.body).toContain("## MVP 指标")
    expect(latestEntry?.body).toContain("### 交付前检查")
    expect(latestEntry?.body).toContain("> [!WARNING]")
    expect(latestEntry?.body).toContain("| 指标 |")
    expect(latestEntry?.body).toContain("```ts")
    expect(latestEntry?.body).toContain(
      "![](/showcase/article-observability.png)",
    )
    expect(assetExists("/showcase/article-observability.png")).toBe(true)
    expect(latestEntry?.channel?.translations[0].name).toBe("文章")
    expect(
      latestEntry?.tags
        .map((row: { tag: { slug: string } }) => row.tag.slug)
        .sort(),
    ).toEqual(["analytics", "nextjs", "self-hosting"])

    expect(channels).toHaveLength(6)
    expect(channels.map((channel) => channel.slug).sort()).toEqual([
      "articles",
      "cards",
      "guestbook",
      "notes",
      "pulse",
      "stream",
    ])
    const enabledChannels = channels.filter((channel) => channel.enabled)
    expect(enabledChannels.length).toBeGreaterThanOrEqual(2)
    expect(enabledChannels.every((channel) => channel.entries.length > 0)).toBe(
      true,
    )
    expect(tags.length).toBeGreaterThanOrEqual(6)
    expect(tags.every((tag) => tag.entries.length > 0)).toBe(true)

    const commentedEntry = await testDb.entry.findUnique({
      where: { slug: "notion-like-markdown-workflow" },
      include: { comments: { where: { status: "APPROVED" } } },
    })
    expect(commentedEntry?.commentCount).toBe(commentedEntry?.comments.length)
    expect(commentedEntry?.comments[0]?.content).toContain("Markdown 存储边界")
  })
})

async function runSeed(): Promise<void> {
  await execFileAsync("pnpm", ["db:seed"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "admin-password-123456",
    },
    timeout: 30_000,
  })
}

function assetExists(path: string | null | undefined): boolean {
  if (!path || !path.startsWith("/")) return false
  return existsSync(join(process.cwd(), "public", path))
}
