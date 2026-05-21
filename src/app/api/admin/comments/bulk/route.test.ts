import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../../../../tests/helpers/db"
import { POST } from "./route"
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

describe("POST /api/admin/comments/bulk (SPEC-C-A-4)", () => {
  it("updates multiple ids in one shot", async () => {
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

    const res = await POST(
      new Request("http://localhost/api/admin/comments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: "APPROVED" }),
      }),
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { updated: number } }
    expect(body.data.updated).toBe(3)

    const all = await testDb.comment.findMany({ where: { id: { in: ids } } })
    expect(all.every((c) => c.status === "APPROVED")).toBe(true)
  })

  it("returns 401 when unauthenticated", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const res = await POST(
      new Request("http://localhost/api/admin/comments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["x"], status: "APPROVED" }),
      }),
    )

    expect(res.status).toBe(401)
  })
})
