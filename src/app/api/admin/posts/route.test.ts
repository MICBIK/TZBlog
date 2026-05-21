import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"
import "dotenv/config"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../../../tests/helpers/db"
import { GET, POST } from "./route"

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

describe("GET /api/admin/posts", () => {
  it("returns the default post list with pagination meta", async () => {
    await seedPost({ slug: "draft-one", title: "草稿一" })
    await seedPost({
      slug: "published-one",
      title: "发布一",
      status: "PUBLISHED",
    })

    const res = await GET(new Request("http://localhost/api/admin/posts"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(2)
    expect(body.meta).toMatchObject({ total: 2, page: 1, pageSize: 20 })
  })

  it("filters by status=PUBLISHED", async () => {
    await seedPost({ slug: "draft-one", title: "草稿一" })
    await seedPost({
      slug: "published-one",
      title: "发布一",
      status: "PUBLISHED",
    })

    const res = await GET(
      new Request("http://localhost/api/admin/posts?status=PUBLISHED"),
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].slug).toBe("published-one")
  })

  it("filters by status=DRAFT", async () => {
    await seedPost({ slug: "draft-one", title: "草稿一" })
    await seedPost({
      slug: "published-one",
      title: "发布一",
      status: "PUBLISHED",
    })

    const res = await GET(
      new Request("http://localhost/api/admin/posts?status=DRAFT"),
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].slug).toBe("draft-one")
  })

  it("filters by columnId", async () => {
    const column = await seedColumn("tech", "技术")
    await seedPost({ slug: "in-column", title: "入栏", columnId: column.id })
    await seedPost({ slug: "without-column", title: "无栏" })

    const res = await GET(
      new Request(
        `http://localhost/api/admin/posts?columnId=${column.id}`,
      ),
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({
      slug: "in-column",
      columnId: column.id,
      columnName: "技术",
    })
  })

  it("filters by tag slug", async () => {
    await seedPost({
      slug: "tagged",
      title: "带标签",
      tags: ["typescript"],
    })
    await seedPost({ slug: "untagged", title: "无标签" })

    const res = await GET(
      new Request("http://localhost/api/admin/posts?tag=typescript"),
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].slug).toBe("tagged")
    expect(body.data[0].tags).toEqual([
      { slug: "typescript", name: "typescript" },
    ])
  })

  it("filters by q against the current locale title", async () => {
    await seedPost({ slug: "match", title: "Vitest 覆盖" })
    await seedPost({ slug: "miss", title: "Next.js 路由" })

    const res = await GET(
      new Request(
        "http://localhost/api/admin/posts?q=" + encodeURIComponent("Vitest"),
      ),
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].slug).toBe("match")
  })

  it("respects page and pageSize", async () => {
    await seedPost({ slug: "page-one", title: "第一页" })
    await seedPost({ slug: "page-two", title: "第二页" })
    await seedPost({ slug: "page-three", title: "第三页" })

    const res = await GET(
      new Request("http://localhost/api/admin/posts?page=2&pageSize=1"),
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.meta).toMatchObject({ total: 3, page: 2, pageSize: 1 })
    expect(body.data).toHaveLength(1)
  })

  it("returns 401 when unauthenticated", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await GET(new Request("http://localhost/api/admin/posts"))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error.code).toBe("UNAUTHORIZED")
  })
})

describe("POST /api/admin/posts", () => {
  it("creates a valid post and returns the full post", async () => {
    const res = await POST(jsonRequest("/api/admin/posts", validCreateBody()))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({
      slug: "new-post",
      status: "DRAFT",
      author: { id: authorId, email: "test-author@tzblog.local" },
    })
    expect(body.data.id).toBeDefined()
    expect(body.data.translations[0]).toMatchObject({
      locale: "zh",
      title: "新文章",
      content: "正文",
    })

    const row = await testDb.post.findUnique({ where: { id: body.data.id } })
    expect(row).not.toBeNull()
  })

  it("returns 409 CONFLICT for a duplicate slug", async () => {
    await seedPost({ slug: "new-post", title: "已有文章" })

    const res = await POST(jsonRequest("/api/admin/posts", validCreateBody()))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error.code).toBe("CONFLICT")
  })

  it("returns 400 when translations are missing", async () => {
    const body = validCreateBody()
    delete (body as Partial<typeof body>).translations

    const res = await POST(jsonRequest("/api/admin/posts", body))
    const parsed = await res.json()

    expect(res.status).toBe(400)
    expect(parsed.error.code).toBe("VALIDATION_ERROR")
  })

  it("returns 401 when unauthenticated", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await POST(jsonRequest("/api/admin/posts", validCreateBody()))
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

function validCreateBody() {
  return {
    slug: "new-post",
    status: "DRAFT",
    tags: ["next-js"],
    translations: [{ locale: "zh", title: "新文章", content: "正文" }],
  }
}

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}
