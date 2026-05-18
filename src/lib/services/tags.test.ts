import { describe, it, expect, beforeEach, afterAll } from "vitest"
import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"
import { listTags, upsertTagsBySlug } from "./tags"

/**
 * Integration tests for the Tag service. RED until agent A's
 * src/lib/services/tags.ts lands; ECC TDD by design.
 */

let authorId: string

beforeEach(async () => {
  await resetAll()
  authorId = await ensureTestUser()
})

afterAll(async () => {
  await disconnectTestDb()
})

describe("upsertTagsBySlug", () => {
  it("inserts new tags and returns rows with ids", async () => {
    const out = await upsertTagsBySlug([
      { slug: "typescript", name: "TypeScript" },
      { slug: "next-js", name: "Next.js" },
    ])
    expect(out).toHaveLength(2)
    for (const t of out) {
      expect(t.id).toBeDefined()
      expect(typeof t.id).toBe("string")
    }
    const slugs = out.map((t) => t.slug).sort()
    expect(slugs).toEqual(["next-js", "typescript"])
  })

  it("returns the same ids on a repeated call (no duplicate creates)", async () => {
    const first = await upsertTagsBySlug([
      { slug: "typescript", name: "TypeScript" },
      { slug: "next-js", name: "Next.js" },
    ])
    const second = await upsertTagsBySlug([
      { slug: "typescript", name: "TypeScript" },
      { slug: "next-js", name: "Next.js" },
    ])
    const idsFirst = new Map(first.map((t) => [t.slug, t.id]))
    const idsSecond = new Map(second.map((t) => [t.slug, t.id]))
    expect(idsSecond.get("typescript")).toBe(idsFirst.get("typescript"))
    expect(idsSecond.get("next-js")).toBe(idsFirst.get("next-js"))

    // Sanity: only two Tag rows total.
    const all = await testDb.tag.findMany()
    expect(all).toHaveLength(2)
  })

  it("falls back to slug as the name when name is omitted", async () => {
    const out = await upsertTagsBySlug([{ slug: "rust" }] as never)
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe("rust")
  })
})

describe("listTags", () => {
  async function seed() {
    // Three tags; only two get attached to a post.
    await upsertTagsBySlug([
      { slug: "typescript", name: "TypeScript" },
      { slug: "next-js", name: "Next.js" },
      { slug: "rust", name: "Rust" },
    ])

    const post = await testDb.post.create({
      data: {
        slug: "p-1",
        authorId,
        status: "PUBLISHED",
        translations: {
          create: [{ locale: "zh", title: "标签", content: "x" }],
        },
      },
    })
    const ts = await testDb.tag.findMany({
      where: { slug: { in: ["typescript", "next-js"] } },
    })
    await testDb.tagsOnPosts.createMany({
      data: ts.map((t) => ({ postId: post.id, tagId: t.id })),
    })
  }

  it("returns every tag with its postCount, including zeros", async () => {
    await seed()
    const tags = await listTags()
    expect(tags).toHaveLength(3)
    const bySlug = new Map(tags.map((t) => [t.slug, t]))
    expect(bySlug.get("typescript")!.postCount).toBe(1)
    expect(bySlug.get("next-js")!.postCount).toBe(1)
    expect(bySlug.get("rust")!.postCount).toBe(0)
  })

  it("filters by q (case-insensitive name contains)", async () => {
    await seed()
    const matches = await listTags({ q: "type" })
    expect(matches.map((t) => t.slug)).toEqual(["typescript"])

    const upper = await listTags({ q: "TYPE" })
    expect(upper.map((t) => t.slug)).toEqual(["typescript"])
  })
})
