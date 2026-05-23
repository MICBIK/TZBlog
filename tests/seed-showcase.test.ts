import { execFile } from "node:child_process"
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
      expect(post.cover).toMatch(/^\/uploads\/audit-cover-\d+\.png$/)
      expect(post.publishedAt).toBeInstanceOf(Date)
      expect(post.translations).toHaveLength(1)
      expect(post.translations[0].locale).toBe("zh")
      expect(post.translations[0].title).not.toEqual("(untitled)")
      expect(post.translations[0].content).toContain("```ts")
      expect(post.translations[0].content).toContain("![](/uploads/audit-image-")
      expect(post.column?.translations[0]?.name).toBeTruthy()
      expect(post.tags.length).toBeGreaterThanOrEqual(2)
    }

    expect(posts.map((post) => post.slug)).toEqual([
      "designing-a-technical-garden",
      "notion-like-markdown-workflow",
      "self-hosted-nextjs-observability",
    ])
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
