import { describe, it, expect, beforeEach, afterAll } from "vitest"

import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"
import {
  bulkUpdateCommentStatus,
  createComment,
  deleteComment,
  listApprovedComments,
  listCommentsForAdmin,
  updateCommentStatus,
} from "./comments"
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
  it("inserts PENDING top-level comment + Post.commentCount stays 0 (SPEC-D3-C-1 / SPEC-C-F-1)", async () => {
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

    // SPEC-C-F-1: 修正 D3 R5，commentCount 不再于 createComment 阶段 +1，
    // 改为只在 status 转换到 APPROVED 时累加（见 §A.2 updateCommentStatus）。
    const updated = await testDb.post.findUnique({ where: { id: post.id } })
    expect(updated!.commentCount).toBe(0)
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
    expect(updated!.commentCount).toBe(0) // SPEC-C-F-1: PENDING 不计
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

describe("updateCommentStatus (SPEC-C-F-2 / V-4 / V-5 / V-8)", () => {
  it("transitions PENDING → APPROVED increments commentCount by 1 (SPEC-C-F-2)", async () => {
    const post = await makePost("hello")
    const c = await testDb.comment.create({
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

    await updateCommentStatus(c.id, "APPROVED", "user-admin")

    const reloaded = await testDb.comment.findUnique({ where: { id: c.id } })
    expect(reloaded!.status).toBe("APPROVED")
    const postReloaded = await testDb.post.findUnique({ where: { id: post.id } })
    expect(postReloaded!.commentCount).toBe(1)
  })

  it("transitions APPROVED → SPAM decrements commentCount by 1 (SPEC-C-F-2)", async () => {
    const post = await makePost("hello")
    const c = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "A",
        authorEmail: "a@x.com",
        content: "x",
        status: "APPROVED",
        visitorHash: "v",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })
    await testDb.post.update({
      where: { id: post.id },
      data: { commentCount: 1 },
    })

    await updateCommentStatus(c.id, "SPAM", "user-admin")

    const postReloaded = await testDb.post.findUnique({ where: { id: post.id } })
    expect(postReloaded!.commentCount).toBe(0)
  })

  it("transitions between non-APPROVED statuses does not change commentCount (SPEC-C-F-2)", async () => {
    const post = await makePost("hello")
    const c = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "A",
        authorEmail: "a@x.com",
        content: "x",
        status: "SPAM",
        visitorHash: "v",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })

    await updateCommentStatus(c.id, "REJECTED", "user-admin")

    const postReloaded = await testDb.post.findUnique({ where: { id: post.id } })
    expect(postReloaded!.commentCount).toBe(0)
  })

  it("writes reviewedBy + reviewedAt on every update (SPEC-C-V-4)", async () => {
    const post = await makePost("hello")
    const c = await testDb.comment.create({
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

    const before = Date.now()
    await updateCommentStatus(c.id, "APPROVED", "user-admin-id")
    const after = Date.now()

    const reloaded = await testDb.comment.findUnique({ where: { id: c.id } })
    expect(reloaded!.reviewedBy).toBe("user-admin-id")
    expect(reloaded!.reviewedAt).not.toBeNull()
    const ts = reloaded!.reviewedAt!.getTime()
    expect(ts).toBeGreaterThanOrEqual(before - 5000)
    expect(ts).toBeLessThanOrEqual(after + 5000)
  })

  it("is idempotent: same status does not double-count, but refreshes reviewedAt (SPEC-C-V-5)", async () => {
    const post = await makePost("hello")
    const c = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "A",
        authorEmail: "a@x.com",
        content: "x",
        status: "APPROVED",
        visitorHash: "v",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
        reviewedBy: "user-1",
        reviewedAt: new Date("2026-01-01"),
      },
    })
    await testDb.post.update({
      where: { id: post.id },
      data: { commentCount: 1 },
    })

    await updateCommentStatus(c.id, "APPROVED", "user-2")

    const reloaded = await testDb.comment.findUnique({ where: { id: c.id } })
    expect(reloaded!.status).toBe("APPROVED")
    expect(reloaded!.reviewedBy).toBe("user-2") // 刷新审核人
    expect(reloaded!.reviewedAt!.getTime()).toBeGreaterThan(
      new Date("2026-01-01").getTime(),
    )

    const postReloaded = await testDb.post.findUnique({ where: { id: post.id } })
    expect(postReloaded!.commentCount).toBe(1) // 不重复 +1
  })

  it("throws NOT_FOUND on missing id (SPEC-C-V-8)", async () => {
    await expect(
      updateCommentStatus("missing-id", "APPROVED", "u"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})

describe("bulkUpdateCommentStatus (SPEC-C-V-6)", () => {
  it("updates multiple ids in transaction (3 PENDING → APPROVED, commentCount +=3)", async () => {
    const post = await makePost("hello")
    const ids: string[] = []
    for (let i = 0; i < 3; i++) {
      const c = await testDb.comment.create({
        data: {
          postId: post.id,
          authorName: `A${i}`,
          authorEmail: `a${i}@x.com`,
          content: `x${i}`,
          status: "PENDING",
          visitorHash: `v${i}`,
          ipAddress: "0.0.0.0",
          userAgent: "UA",
        },
      })
      ids.push(c.id)
    }

    const result = await bulkUpdateCommentStatus(ids, "APPROVED", "user-admin")

    expect(result.updated).toBe(3)
    const all = await testDb.comment.findMany({ where: { id: { in: ids } } })
    expect(all.every((c) => c.status === "APPROVED")).toBe(true)
    expect(all.every((c) => c.reviewedBy === "user-admin")).toBe(true)
    const postReloaded = await testDb.post.findUnique({ where: { id: post.id } })
    expect(postReloaded!.commentCount).toBe(3)
  })
})

describe("deleteComment (SPEC-C-F-3 / V-7 / V-8)", () => {
  it("decrements commentCount when deleting an APPROVED comment (SPEC-C-F-3)", async () => {
    const post = await makePost("hello")
    const c = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "A",
        authorEmail: "a@x.com",
        content: "x",
        status: "APPROVED",
        visitorHash: "v",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })
    await testDb.post.update({
      where: { id: post.id },
      data: { commentCount: 1 },
    })

    await deleteComment(c.id)

    expect(
      await testDb.comment.findUnique({ where: { id: c.id } }),
    ).toBeNull()
    const postReloaded = await testDb.post.findUnique({ where: { id: post.id } })
    expect(postReloaded!.commentCount).toBe(0)
  })

  it("does NOT change commentCount when deleting a non-APPROVED comment", async () => {
    const post = await makePost("hello")
    const c = await testDb.comment.create({
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

    await deleteComment(c.id)

    const postReloaded = await testDb.post.findUnique({ where: { id: post.id } })
    expect(postReloaded!.commentCount).toBe(0)
  })

  it("cascades replies; adjusts commentCount by approved-self + approved-replies count (SPEC-C-V-7)", async () => {
    const post = await makePost("hello")
    const top = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "Top",
        authorEmail: "t@x.com",
        content: "top",
        status: "APPROVED",
        visitorHash: "vt",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })
    const reply1 = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "R1",
        authorEmail: "r1@x.com",
        content: "r1",
        status: "APPROVED",
        parentId: top.id,
        visitorHash: "vr1",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })
    const reply2 = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "R2",
        authorEmail: "r2@x.com",
        content: "r2",
        status: "PENDING",
        parentId: top.id,
        visitorHash: "vr2",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
      },
    })
    await testDb.post.update({
      where: { id: post.id },
      data: { commentCount: 2 }, // top + reply1 (approved)
    })

    await deleteComment(top.id)

    expect(
      await testDb.comment.findUnique({ where: { id: top.id } }),
    ).toBeNull()
    expect(
      await testDb.comment.findUnique({ where: { id: reply1.id } }),
    ).toBeNull()
    expect(
      await testDb.comment.findUnique({ where: { id: reply2.id } }),
    ).toBeNull()

    const postReloaded = await testDb.post.findUnique({ where: { id: post.id } })
    // top (APPROVED -1) + reply1 (APPROVED -1) + reply2 (PENDING, no delta) = -2 from 2 → 0
    expect(postReloaded!.commentCount).toBe(0)
  })

  it("throws NOT_FOUND on missing id (SPEC-C-V-8)", async () => {
    await expect(deleteComment("missing-id")).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })
})

describe("listCommentsForAdmin (SPEC-C-V-1..3)", () => {
  async function seedFourStatuses(post: { id: string }): Promise<void> {
    for (const status of ["PENDING", "APPROVED", "SPAM", "REJECTED"] as const) {
      await testDb.comment.create({
        data: {
          postId: post.id,
          authorName: `Author-${status}`,
          authorEmail: `${status.toLowerCase()}@x.com`,
          content: `content for ${status}`,
          status,
          visitorHash: `v-${status}`,
          ipAddress: "0.0.0.0",
          userAgent: "UA",
        },
      })
    }
  }

  it("returns all 4 statuses with post relation and pagination meta (SPEC-C-V-1)", async () => {
    const post = await makePost("hello")
    await seedFourStatuses(post)

    const r = await listCommentsForAdmin({ page: 1, pageSize: 20 })

    expect(r.total).toBe(4)
    expect(r.items).toHaveLength(4)
    expect(r.items[0].post.slug).toBe("hello")
    expect(typeof r.items[0].post.title).toBe("string")
  })

  it("filters by status (SPEC-C-V-2)", async () => {
    const post = await makePost("hello")
    await seedFourStatuses(post)

    const r = await listCommentsForAdmin({ status: "PENDING" })

    expect(r.total).toBe(1)
    expect(r.items[0].status).toBe("PENDING")
  })

  it("filters by q case-insensitively across authorName / content (SPEC-C-V-3)", async () => {
    const post = await makePost("hello")
    await seedFourStatuses(post)

    const rLower = await listCommentsForAdmin({ q: "author-approved" })
    expect(rLower.total).toBe(1)
    expect(rLower.items[0].status).toBe("APPROVED")

    const rUpper = await listCommentsForAdmin({ q: "AUTHOR-APPROVED" })
    expect(rUpper.total).toBe(1)
  })
})
