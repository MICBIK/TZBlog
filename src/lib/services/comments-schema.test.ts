import { describe, it, expect, beforeEach, afterAll } from "vitest"

import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"
import { createPost } from "./posts"

/**
 * Schema-level integration test driving SPEC-C-S-1..2:
 *
 *   Comment table must accept the new `reviewedBy: String?` and
 *   `reviewedAt: DateTime?` columns introduced by the
 *   `add_comment_review_fields` migration. We assert via testDb.comment.create
 *   that the columns persist and unset values default to null.
 *
 * This is the RED→GREEN driver for the migration commit; without the schema
 * change, Prisma's generated types reject these fields and TypeScript fails.
 */

let authorId: string

beforeEach(async () => {
  await resetAll()
  authorId = await ensureTestUser()
})

afterAll(async () => {
  await disconnectTestDb()
})

async function makePost(slug = "hello"): Promise<{ id: string }> {
  return createPost(
    {
      slug,
      status: "PUBLISHED",
      translations: [{ locale: "zh", title: "hi", content: "body" }],
      tags: [],
    } as never,
    authorId,
  )
}

describe("Comment.reviewedBy + reviewedAt schema (SPEC-C-S-1..2)", () => {
  it("accepts reviewedBy + reviewedAt on Comment.create", async () => {
    const post = await makePost("hello")
    const reviewedAt = new Date("2026-05-21T12:00:00Z")

    const created = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "A",
        authorEmail: "a@x.com",
        content: "x",
        status: "APPROVED",
        visitorHash: "v",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
        reviewedBy: "user-admin",
        reviewedAt,
      },
    })

    expect(created.reviewedBy).toBe("user-admin")
    expect(created.reviewedAt).toEqual(reviewedAt)
  })

  it("defaults reviewedBy + reviewedAt to null when unset", async () => {
    const post = await makePost("hello")

    const created = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "A",
        authorEmail: "a@x.com",
        content: "x",
        status: "PENDING",
        visitorHash: "v",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })

    expect(created.reviewedBy).toBeNull()
    expect(created.reviewedAt).toBeNull()
  })

  it("supports ai-* prefix marker in reviewedBy (R9 future-proof)", async () => {
    const post = await makePost("hello")

    const created = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "A",
        authorEmail: "a@x.com",
        content: "x",
        status: "APPROVED",
        visitorHash: "v",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
        reviewedBy: "ai-gpt-4o-2026-05",
        reviewedAt: new Date(),
      },
    })

    expect(created.reviewedBy).toBe("ai-gpt-4o-2026-05")
  })
})
