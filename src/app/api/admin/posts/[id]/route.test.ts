import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"
import "dotenv/config"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../../../../tests/helpers/db"
import { DELETE, GET, PATCH } from "./route"

let authorId: string

beforeEach(async () => {
  await resetAll()
  authorId = await ensureTestUser()
  ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: authorId, email: "test@x.com" },
    expires: new Date(Date.now() + 86400_000).toISOString(),
  })
})

afterAll(async () => {
  await disconnectTestDb()
})

describe("GET /api/admin/posts/[id]", () => {
  it("returns the post with translations, column, tags, and author", async () => {
    const column = await seedColumn("tech", "技术")
    const post = await seedPost({
      slug: "with-relations",
      title: "带关系",
      columnId: column.id,
      tags: ["typescript"],
    })

    const res = await GET(request(post.id), ctx(post.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({
      id: post.id,
      slug: "with-relations",
      author: { id: authorId, email: "test-author@tzblog.local" },
      column: { id: column.id },
    })
    expect(body.data.translations[0]).toMatchObject({
      locale: "zh",
      title: "带关系",
    })
    expect(body.data.column.translations[0]).toMatchObject({
      locale: "zh",
      name: "技术",
    })
    expect(body.data.tags[0].tag).toMatchObject({
      slug: "typescript",
      name: "typescript",
    })
  })

  it("returns 404 for a missing id", async () => {
    const res = await GET(request("missing"), ctx("missing"))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("returns 401 when unauthenticated", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await GET(request("anything"), ctx("anything"))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error.code).toBe("UNAUTHORIZED")
  })
})

describe("PATCH /api/admin/posts/[id]", () => {
  it("upserts an existing translation in place", async () => {
    const post = await seedPost({ slug: "patch-translation", title: "旧标题" })

    const res = await PATCH(
      jsonRequest(post.id, {
        translations: [
          {
            locale: "zh",
            title: "新标题",
            excerpt: "新摘要",
            content: "新正文",
          },
        ],
      }),
      ctx(post.id),
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.translations).toHaveLength(1)
    expect(body.data.translations[0]).toMatchObject({
      locale: "zh",
      title: "新标题",
      excerpt: "新摘要",
      content: "新正文",
    })

    const rows = await testDb.postTranslation.findMany({
      where: { postId: post.id },
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].title).toBe("新标题")
  })

  it("stamps publishedAt when status changes from DRAFT to PUBLISHED", async () => {
    const post = await seedPost({
      slug: "publish-me",
      title: "待发布",
      status: "DRAFT",
    })

    const before = Date.now()
    const res = await PATCH(jsonRequest(post.id, { status: "PUBLISHED" }), ctx(post.id))
    const after = Date.now()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.status).toBe("PUBLISHED")
    expect(body.data.publishedAt).toBeTruthy()

    const row = await testDb.post.findUnique({ where: { id: post.id } })
    expect(row!.publishedAt).not.toBeNull()
    const stampedAt = row!.publishedAt!.getTime()
    expect(stampedAt).toBeGreaterThanOrEqual(before - 5000)
    expect(stampedAt).toBeLessThanOrEqual(after + 5000)
  })

  it("replaces the full tag set", async () => {
    const post = await seedPost({
      slug: "replace-tags",
      title: "替换标签",
      tags: ["old", "stay"],
    })

    const res = await PATCH(
      jsonRequest(post.id, { tags: ["new", "stay"] }),
      ctx(post.id),
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(
      body.data.tags.map((row: { tag: { slug: string } }) => row.tag.slug).sort(),
    ).toEqual(["new", "stay"])

    const links = await testDb.tagsOnPosts.findMany({
      where: { postId: post.id },
      include: { tag: true },
      orderBy: { tag: { slug: "asc" } },
    })
    expect(links.map((row) => row.tag.slug)).toEqual(["new", "stay"])
  })

  it("returns 404 for a missing id", async () => {
    const res = await PATCH(jsonRequest("missing", { status: "PUBLISHED" }), ctx("missing"))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("returns 401 when unauthenticated", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await PATCH(jsonRequest("anything", { status: "PUBLISHED" }), ctx("anything"))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error.code).toBe("UNAUTHORIZED")
  })
})

describe("DELETE /api/admin/posts/[id]", () => {
  it("deletes the post and cascades translations and tag links", async () => {
    const post = await seedPost({
      slug: "delete-me",
      title: "删除我",
      tags: ["typescript", "next-js"],
    })

    expect(await testDb.postTranslation.count({ where: { postId: post.id } })).toBe(1)
    expect(await testDb.tagsOnPosts.count({ where: { postId: post.id } })).toBe(2)

    const res = await DELETE(request(post.id, "DELETE"), ctx(post.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.id).toBe(post.id)
    expect(await testDb.post.findUnique({ where: { id: post.id } })).toBeNull()
    expect(await testDb.postTranslation.count({ where: { postId: post.id } })).toBe(0)
    expect(await testDb.tagsOnPosts.count({ where: { postId: post.id } })).toBe(0)
  })

  it("returns 404 for a missing id", async () => {
    const res = await DELETE(request("missing", "DELETE"), ctx("missing"))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("returns 401 when unauthenticated", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await DELETE(request("anything", "DELETE"), ctx("anything"))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error.code).toBe("UNAUTHORIZED")
  })
})

type SeedPostInput = {
  slug: string
  title: string
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  columnId?: string
  tags?: string[]
}

async function seedColumn(slug: string, name: string) {
  return testDb.column.create({
    data: {
      slug,
      translations: { create: { locale: "zh", name } },
    },
  })
}

async function seedPost({
  slug,
  title,
  status = "DRAFT",
  columnId,
  tags = [],
}: SeedPostInput) {
  const tagRows = await Promise.all(
    tags.map((tagSlug) =>
      testDb.tag.upsert({
        where: { slug: tagSlug },
        update: { name: tagSlug },
        create: { slug: tagSlug, name: tagSlug },
      }),
    ),
  )

  return testDb.post.create({
    data: {
      slug,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      authorId,
      columnId: columnId ?? null,
      translations: {
        create: {
          locale: "zh",
          title,
          excerpt: `${title} 摘要`,
          content: `${title} 正文`,
        },
      },
      tags:
        tagRows.length > 0
          ? { create: tagRows.map((tag) => ({ tagId: tag.id })) }
          : undefined,
    },
  })
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}

function request(id: string, method = "GET") {
  return new Request(`http://localhost/api/admin/posts/${id}`, { method })
}

function jsonRequest(id: string, body: unknown) {
  return new Request(`http://localhost/api/admin/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}
