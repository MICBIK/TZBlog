import { describe, it, expect, beforeEach, afterAll } from "vitest"

import {
  resetAll,
  ensureTestUser,
  testDb,
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

const validBody = {
  authorName: "Alice",
  authorEmail: "alice@example.com",
  content: "great post!",
}

function mkPostReq(
  slug: string,
  body: unknown,
  opts: { ip?: string; ua?: string } = {},
): Request {
  return new Request(`http://localhost/api/posts/${slug}/comments`, {
    method: "POST",
    headers: {
      "x-forwarded-for": opts.ip ?? "10.0.0.1",
      "user-agent": opts.ua ?? "default-UA",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

function mkGetReq(slug: string): Request {
  return new Request(`http://localhost/api/posts/${slug}/comments`)
}

describe("POST /api/posts/[slug]/comments", () => {
  it("rate-limits 5min/3 per visitorHash (SPEC-D3-C-8)", async () => {
    await makePost("hello")
    // 同 ip + ua → 同 visitorHash（用本测试独占的标识避免跨测试串扰）
    const lockedOpts = { ip: "192.168.99.99", ua: "rate-limit-test-UA" }
    const ctx = { params: Promise.resolve({ slug: "hello" }) }

    for (let i = 0; i < 3; i++) {
      const res = await POST(
        mkPostReq("hello", { ...validBody, content: `body ${i}` }, lockedOpts),
        ctx,
      )
      expect(res.status).toBe(201)
    }

    const res4 = await POST(
      mkPostReq("hello", { ...validBody, content: "fourth" }, lockedOpts),
      ctx,
    )
    expect(res4.status).toBe(429)
    const body4 = (await res4.json()) as { error: { code: string } }
    expect(body4.error.code).toBe("RATE_LIMITED")

    const all = await testDb.comment.findMany()
    expect(all).toHaveLength(3)
  })
})

describe("GET /api/posts/[slug]/comments", () => {
  it("returns APPROVED-only nested (SPEC-D3-C-9)", async () => {
    const post = await makePost("hello")

    const top = await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "T",
        authorEmail: "t@x.com",
        content: "top",
        status: "APPROVED",
        visitorHash: "vt",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
        createdAt: new Date("2026-01-01"),
      },
    })
    await testDb.comment.create({
      data: {
        postId: post.id,
        authorName: "R",
        authorEmail: "r@x.com",
        content: "reply",
        status: "APPROVED",
        parentId: top.id,
        visitorHash: "vr",
        ipAddress: "0.0.0.0",
        userAgent: "UA",
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

    const ctx = { params: Promise.resolve({ slug: "hello" }) }
    const res = await GET(mkGetReq("hello"), ctx)

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: { comments: Array<{ id: string; replies: Array<{ id: string }> }> }
    }
    expect(body.data.comments).toHaveLength(1)
    expect(body.data.comments[0].id).toBe(top.id)
    expect(body.data.comments[0].replies).toHaveLength(1)
  })

  it("returns 404 on missing slug", async () => {
    const ctx = { params: Promise.resolve({ slug: "ghost" }) }
    const res = await GET(mkGetReq("ghost"), ctx)
    expect(res.status).toBe(404)
  })
})
