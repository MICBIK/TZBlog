import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../../../../tests/helpers/db"
import { DELETE, PATCH } from "./route"
import { createPost } from "@/lib/services/posts"

let authorId: string

beforeEach(async () => {
  await resetAll()
  authorId = await ensureTestUser()
  ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: authorId, email: "admin@x.com" },
    expires: new Date(Date.now() + 86400_000).toISOString(),
  })
})

afterAll(async () => {
  await disconnectTestDb()
})

async function makePost(slug = "hello"): Promise<{ id: string }> {
  return createPost(
    {
      slug,
      status: "PUBLISHED",
      translations: [{ locale: "zh", title: "你好", content: "body" }],
      tags: [],
    } as never,
    authorId,
  )
}

async function seedPending(postId: string): Promise<{ id: string }> {
  return testDb.comment.create({
    data: {
      postId,
      authorName: "A",
      authorEmail: "a@x.com",
      content: "x",
      status: "PENDING",
      visitorHash: "v",
      ipAddress: "0.0.0.0",
      userAgent: "UA",
    },
  })
}

describe("PATCH /api/admin/comments/[id] (SPEC-C-A-2)", () => {
  it("updates status + writes reviewedBy = session.user.id", async () => {
    const post = await makePost("hello")
    const c = await seedPending(post.id)

    const res = await PATCH(
      new Request(`http://localhost/api/admin/comments/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      }),
      { params: Promise.resolve({ id: c.id }) },
    )

    expect(res.status).toBe(200)
    const reloaded = await testDb.comment.findUnique({ where: { id: c.id } })
    expect(reloaded!.status).toBe("APPROVED")
    expect(reloaded!.reviewedBy).toBe(authorId)
  })

  it("returns 401 when unauthenticated (SPEC-C-A-5)", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const res = await PATCH(
      new Request("http://localhost/api/admin/comments/whatever", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      }),
      { params: Promise.resolve({ id: "whatever" }) },
    )

    expect(res.status).toBe(401)
  })
})

describe("DELETE /api/admin/comments/[id] (SPEC-C-A-3)", () => {
  it("removes the row", async () => {
    const post = await makePost("hello")
    const c = await seedPending(post.id)

    const res = await DELETE(
      new Request(`http://localhost/api/admin/comments/${c.id}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: c.id }) },
    )

    expect(res.status).toBe(200)
    expect(
      await testDb.comment.findUnique({ where: { id: c.id } }),
    ).toBeNull()
  })

  it("returns 401 when unauthenticated", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const res = await DELETE(
      new Request("http://localhost/api/admin/comments/whatever", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "whatever" }) },
    )

    expect(res.status).toBe(401)
  })
})
