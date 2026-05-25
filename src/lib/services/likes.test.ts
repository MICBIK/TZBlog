import { describe, it, expect, beforeEach, afterAll } from "vitest"

import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"
import { addLike, hasLikedBy } from "./likes"
import { createTestArticle } from "@/lib/test/createTestArticle"

let authorId: string

beforeEach(async () => {
  await resetAll()
  authorId = await ensureTestUser()
})

afterAll(async () => {
  await disconnectTestDb()
})

async function makePost(slug = "hello"): Promise<string> {
  const entry = await createTestArticle(authorId, {
    slug,
    status: "PUBLISHED",
    title: "hi",
    content: "body",
  });
  return entry.id;
}

describe("addLike", () => {
  it("creates a PostLike row + increments likeCount on first like (SPEC-D3-L-1)", async () => {
    await makePost("hello")

    const result = await addLike("hello", "vh-alice")

    expect(result).toEqual({ liked: true, likeCount: 1 })

    const post = await testDb.post.findUnique({ where: { slug: "hello" } })
    expect(post!.likeCount).toBe(1)

    const likes = await testDb.postLike.findMany({
      where: { post: { slug: "hello" } },
    })
    expect(likes).toHaveLength(1)
    expect(likes[0].visitorHash).toBe("vh-alice")
  })

  it("is idempotent on duplicate visitorHash (SPEC-D3-L-2)", async () => {
    await makePost("hello")
    await addLike("hello", "vh-alice")

    const result = await addLike("hello", "vh-alice")

    expect(result).toEqual({ liked: true, likeCount: 1 })

    const post = await testDb.post.findUnique({ where: { slug: "hello" } })
    expect(post!.likeCount).toBe(1)

    const likes = await testDb.postLike.findMany({
      where: { post: { slug: "hello" } },
    })
    expect(likes).toHaveLength(1)
  })

  it("throws NOT_FOUND on missing slug (SPEC-D3-L-4)", async () => {
    await expect(addLike("ghost", "vh-x")).rejects.toMatchObject({
      code: "NOT_FOUND",
    })

    const likes = await testDb.postLike.findMany()
    expect(likes).toHaveLength(0)
  })
})

describe("hasLikedBy", () => {
  it("returns true for visitor who liked, false for others (SPEC-D3-L-3)", async () => {
    await makePost("hello")
    await addLike("hello", "vh-alice")

    expect(await hasLikedBy("hello", "vh-alice")).toBe(true)
    expect(await hasLikedBy("hello", "vh-bob")).toBe(false)
  })
})
