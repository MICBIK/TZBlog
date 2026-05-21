import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../../../tests/helpers/db"
import { GET } from "./route"
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

async function seedComment(
  postId: string,
  status: "PENDING" | "APPROVED" | "SPAM" | "REJECTED" = "PENDING",
  override: Partial<{
    authorName: string
    content: string
  }> = {},
): Promise<{ id: string }> {
  return testDb.comment.create({
    data: {
      postId,
      authorName: override.authorName ?? "Alice",
      authorEmail: "a@x.com",
      content: override.content ?? "hello world",
      status,
      visitorHash: `v-${Math.random()}`,
      ipAddress: "1.1.1.1",
      userAgent: "UA",
    },
  })
}

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

describe("GET /api/admin/comments (SPEC-C-A-1)", () => {
  it("returns 200 + meta with PENDING filter", async () => {
    const post = await makePost("hello")
    await seedComment(post.id, "PENDING")
    await seedComment(post.id, "APPROVED")

    const res = await GET(
      new Request("http://localhost/api/admin/comments?status=PENDING"),
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: Array<{ status: string }>
      meta: { total: number; page: number; pageSize: number }
    }
    expect(body.meta.total).toBe(1)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].status).toBe("PENDING")
  })

  it("returns 401 when unauthenticated (SPEC-C-A-5)", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const res = await GET(new Request("http://localhost/api/admin/comments"))

    expect(res.status).toBe(401)
  })
})
