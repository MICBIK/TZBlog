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

    const [posts, columns, tags, comments, config] = await Promise.all([
      testDb.post.findMany({
        where: { status: "PUBLISHED" },
        include: {
          translations: true,
          column: { include: { translations: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { slug: "asc" },
      }),
      testDb.column.findMany({ include: { translations: true } }),
      testDb.tag.findMany({ orderBy: { slug: "asc" } }),
      testDb.comment.findMany({ where: { status: "APPROVED" } }),
      testDb.siteConfig.findUnique({ where: { id: "singleton" } }),
    ])

    expect(config?.metadata).toMatchObject({
      title: "TZBlog",
      description: expect.stringContaining("技术博客"),
    })
    expect(posts).toHaveLength(3)
    expect(columns).toHaveLength(2)
    expect(tags.length).toBeGreaterThanOrEqual(5)
    expect(comments.length).toBeGreaterThanOrEqual(2)

    for (const post of posts) {
      expect(post.cover).toMatch(/^\/showcase\/cover-[\w-]+\.png$/)
      expect(assetExists(post.cover)).toBe(true)
      expect(post.publishedAt).toBeInstanceOf(Date)
      expect(post.translations).toHaveLength(1)
      expect(post.translations[0].locale).toBe("zh")
      expect(post.translations[0].title).not.toEqual("(untitled)")
      expect(post.translations[0].content).toContain("```ts")
      expect(post.translations[0].content).toContain("![](/showcase/article-")
      expect(post.column?.translations[0]?.name).toBeTruthy()
      expect(post.tags.length).toBeGreaterThanOrEqual(2)
    }

    expect(posts.map((post) => post.slug)).toEqual([
      "designing-a-technical-garden",
      "notion-like-markdown-workflow",
      "self-hosted-nextjs-observability",
    ])
  })

  it("seededContentSupportsPublicShowcaseRoutes", async () => {
    await runSeed()

    const latestPost = await testDb.post.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
      include: {
        translations: true,
        column: { include: { translations: true } },
        tags: { include: { tag: true } },
        comments: { where: { status: "APPROVED" } },
      },
    })
    const columns = await testDb.column.findMany({
      include: {
        translations: true,
        posts: { where: { status: "PUBLISHED" }, select: { id: true } },
      },
    })
    const tags = await testDb.tag.findMany({
      include: {
        posts: {
          where: { post: { status: "PUBLISHED" } },
          select: { postId: true },
        },
      },
    })

    expect(latestPost?.slug).toBe("self-hosted-nextjs-observability")
    expect(latestPost?.cover).toMatch(/^\/showcase\/cover-[\w-]+\.png$/)
    expect(assetExists(latestPost?.cover)).toBe(true)
    expect(latestPost?.translations[0].content).toContain("## MVP 指标")
    expect(latestPost?.translations[0].content).toContain("### 交付前检查")
    expect(latestPost?.translations[0].content).toContain("> [!WARNING]")
    expect(latestPost?.translations[0].content).toContain("| 指标 |")
    expect(latestPost?.translations[0].content).toContain("```ts")
    expect(latestPost?.translations[0].content).toContain(
      "![](/showcase/article-observability.png)",
    )
    expect(assetExists("/showcase/article-observability.png")).toBe(true)
    expect(latestPost?.column?.translations[0].name).toBe("工程札记")
    expect(
      latestPost?.tags
        .map((row: { tag: { slug: string } }) => row.tag.slug)
        .sort(),
    ).toEqual([
      "analytics",
      "nextjs",
      "self-hosting",
    ])

    expect(columns).toHaveLength(2)
    expect(columns.every((column) => column.posts.length > 0)).toBe(true)
    expect(columns.every((column) => assetExists(column.cover))).toBe(true)
    expect(tags.length).toBeGreaterThanOrEqual(6)
    expect(tags.every((tag) => tag.posts.length > 0)).toBe(true)

    const commentedPost = await testDb.post.findUnique({
      where: { slug: "notion-like-markdown-workflow" },
      include: { comments: { where: { status: "APPROVED" } } },
    })
    expect(commentedPost?.commentCount).toBe(commentedPost?.comments.length)
    expect(commentedPost?.comments[0]?.content).toContain("Markdown 存储边界")
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
