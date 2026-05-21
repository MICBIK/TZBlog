import { describe, it, expect, beforeEach, afterAll } from "vitest"

import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"
import { createComment, listApprovedComments } from "./comments"
import { createPost } from "./posts"

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

const author = {
  authorName: "Alice",
  authorEmail: "alice@example.com",
} as const

function visitor(suffix = "vh"): {
  visitorHash: string
  ipAddress: string
  userAgent: string
} {
  return { visitorHash: suffix, ipAddress: "1.1.1.1", userAgent: "UA" }
}

describe("createComment", () => {
  it("inserts PENDING top-level comment + Post.commentCount +1 (SPEC-D3-C-1)", async () => {
    const post = await makePost("hello")

    const result = await createComment({
      slug: "hello",
      ...author,
      content: "hi there",
      ...visitor("v1"),
    })

    expect(result.status).toBe("PENDING")

    const c = await testDb.comment.findUnique({ where: { id: result.id } })
    expect(c).not.toBeNull()
    expect(c!.parentId).toBeNull()
    expect(c!.status).toBe("PENDING")
    expect(c!.authorName).toBe("Alice")
    expect(c!.authorEmail).toBe("alice@example.com")
    expect(c!.content).toBe("hi there")

    const updated = await testDb.post.findUnique({ where: { id: post.id } })
    expect(updated!.commentCount).toBe(1)
  })

  it("creates depth-2 reply when parentId points to APPROVED top-level (SPEC-D3-C-2)", async () => {
    const post = await makePost("hello")
    const top = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "Top",
        authorEmail: "top@x.com",
        content: "top",
        status: "APPROVED",
        visitorHash: "vh-top",
        ipAddress: "0.0.0.0",
        userAgent: "old-UA",
      },
    })

    const result = await createComment({
      slug: "hello",
      ...author,
      content: "reply",
      ...visitor("v2"),
      parentId: top.id,
    })

    const c = await testDb.comment.findUnique({ where: { id: result.id } })
    expect(c!.parentId).toBe(top.id)
    expect(c!.status).toBe("PENDING")

    const updated = await testDb.post.findUnique({ where: { id: post.id } })
    expect(updated!.commentCount).toBe(1) // 仅 createComment 加的那次
  })

  it("rejects reply-of-reply with VALIDATION_ERROR (SPEC-D3-C-3)", async () => {
    const post = await makePost("hello")
    const top = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "Top",
        authorEmail: "t@x.com",
        content: "top",
        status: "APPROVED",
        visitorHash: "vh-t",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })
    const reply = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "Mid",
        authorEmail: "m@x.com",
        content: "reply",
        status: "APPROVED",
        parentId: top.id,
        visitorHash: "vh-m",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })

    await expect(
      createComment({
        slug: "hello",
        ...author,
        content: "deeper",
        ...visitor("v3"),
        parentId: reply.id,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" })

    const updated = await testDb.post.findUnique({ where: { id: post.id } })
    expect(updated!.commentCount).toBe(0)
  })

  it("throws NOT_FOUND on missing slug (SPEC-D3-C-4)", async () => {
    await expect(
      createComment({
        slug: "ghost",
        ...author,
        content: "x",
        ...visitor("vx"),
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })

  it("throws NOT_FOUND on missing parentId (SPEC-D3-C-5)", async () => {
    await makePost("hello")
    await expect(
      createComment({
        slug: "hello",
        ...author,
        content: "x",
        ...visitor("vx"),
        parentId: "non-existent-id",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})

describe("listApprovedComments", () => {
  it("returns nested APPROVED only, top sorted createdAt asc (SPEC-D3-C-7)", async () => {
    const post = await makePost("hello")

    const c1 = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "A1",
        authorEmail: "a1@x.com",
        content: "first",
        status: "APPROVED",
        visitorHash: "v1",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    })
    const c2 = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "A2",
        authorEmail: "a2@x.com",
        content: "second",
        status: "APPROVED",
        visitorHash: "v2",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
        createdAt: new Date("2026-01-02T00:00:00Z"),
      },
    })
    const c1r1 = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "R1",
        authorEmail: "r1@x.com",
        content: "reply",
        status: "APPROVED",
        parentId: c1.id,
        visitorHash: "vr1",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
        createdAt: new Date("2026-01-01T12:00:00Z"),
      },
    })
    await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "P",
        authorEmail: "p@x.com",
        content: "pending",
        status: "PENDING",
        visitorHash: "vp",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })
    await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "S",
        authorEmail: "s@x.com",
        content: "spam",
        status: "SPAM",
        visitorHash: "vs",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })

    const result = await listApprovedComments(post.id)

    expect(result.map((c) => c.id)).toEqual([c1.id, c2.id])
    expect(result[0].replies.map((r) => r.id)).toEqual([c1r1.id])
    expect(result[1].replies).toEqual([])
  })
})
