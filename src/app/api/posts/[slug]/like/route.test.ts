import { describe, it, expect, beforeEach, afterAll } from "vitest"

import {
  resetAll,
  ensureTestUser,
  disconnectTestDb,
} from "../../../../../../tests/helpers/db"
import { GET, POST } from "./route"
import { createPost } from "@/lib/services/posts"

let authorId: string

beforeEach(async () => {
  await resetAll()
  authorId = await ensureTestUser()
})

afterAll(async () => {
  await disconnectTestDb()
})

async function makePost(slug = "hello"): Promise<void> {
  await createPost(
    {
      slug,
      status: "PUBLISHED",
      translations: [{ locale: "zh", title: "hi", content: "body" }],
      tags: [],
    } as never,
    authorId,
  )
}

function mkReq(
  url: string,
  init: { method?: string; ip?: string; ua?: string } = {},
): Request {
  return new Request(url, {
    method: init.method ?? "GET",
    headers: {
      "x-forwarded-for": init.ip ?? "1.1.1.1",
      "user-agent": init.ua ?? "test-agent",
    },
  })
}

describe("POST /api/posts/[slug]/like", () => {
  it("returns 200 + {liked:true, likeCount:1} on first like (SPEC-D3-L-5)", async () => {
    await makePost("hello")

    const res = await POST(
      mkReq("http://localhost/api/posts/hello/like", { method: "POST" }),
      { params: Promise.resolve({ slug: "hello" }) },
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { liked: boolean; likeCount: number } }
    expect(body.data).toEqual({ liked: true, likeCount: 1 })
  })

  it("returns 404 on missing slug (SPEC-D3-L-6)", async () => {
    const res = await POST(
      mkReq("http://localhost/api/posts/ghost/like", { method: "POST" }),
      { params: Promise.resolve({ slug: "ghost" }) },
    )

    expect(res.status).toBe(404)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe("NOT_FOUND")
  })
})

describe("GET /api/posts/[slug]/like", () => {
  it("returns per-visitor liked state + likeCount (SPEC-D3-L-7)", async () => {
    await makePost("hello")

    // Alice POSTs a like
    await POST(
      mkReq("http://localhost/api/posts/hello/like", {
        method: "POST",
        ip: "10.0.0.1",
        ua: "Alice-UA",
      }),
      { params: Promise.resolve({ slug: "hello" }) },
    )

    // GET as Alice → liked: true
    const resA = await GET(
      mkReq("http://localhost/api/posts/hello/like", {
        ip: "10.0.0.1",
        ua: "Alice-UA",
      }),
      { params: Promise.resolve({ slug: "hello" }) },
    )
    expect(resA.status).toBe(200)
    const bodyA = (await resA.json()) as { data: { liked: boolean; likeCount: number } }
    expect(bodyA.data).toEqual({ liked: true, likeCount: 1 })

    // GET as Bob (different IP/UA → different visitorHash) → liked: false
    const resB = await GET(
      mkReq("http://localhost/api/posts/hello/like", {
        ip: "10.0.0.2",
        ua: "Bob-UA",
      }),
      { params: Promise.resolve({ slug: "hello" }) },
    )
    expect(resB.status).toBe(200)
    const bodyB = (await resB.json()) as { data: { liked: boolean; likeCount: number } }
    expect(bodyB.data).toEqual({ liked: false, likeCount: 1 })
  })
})
