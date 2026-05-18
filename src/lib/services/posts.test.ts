import { describe, it, expect, beforeEach, afterAll } from "vitest"
import {
  resetAll,
  ensureTestUser,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"
import {
  createPost,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
  listPosts,
  incrementPostView,
} from "./posts"
import { AppError } from "@/lib/errors"

/**
 * Integration tests against the dev Postgres (port 5433, db `tzblog`).
 * Service-under-test uses `@/lib/db` which points at the same DATABASE_URL,
 * so truncating via testDb in beforeEach cleanly resets the world.
 *
 * These tests target the agent A contract from the task brief:
 *   createPost(input, authorId)
 *   getPostById(id) / getPostBySlug(slug)
 *   updatePost / deletePost
 *   listPosts(filter, locale): { items, total, page, pageSize }
 *   incrementPostView(slug, visitorHash, dayKey): { counted, viewCount }
 *
 * They will RED until agent A's implementation lands. ECC TDD — by design.
 */

let authorId: string

beforeEach(async () => {
  await resetAll()
  authorId = await ensureTestUser()
})

afterAll(async () => {
  await disconnectTestDb()
})

const zh = (title: string, content = "正文") => ({
  locale: "zh",
  title,
  content,
})

describe("createPost", () => {
  it("creates a DRAFT with a single zh translation; publishedAt stays null", async () => {
    const p = await createPost(
      {
        slug: "hello",
        status: "DRAFT",
        translations: [zh("你好")],
        tags: [],
      } as never,
      authorId,
    )
    expect(p.id).toBeDefined()
    expect(p.slug).toBe("hello")
    // The shape returned could be Post-with-relations; assert what we can.
    const found = await testDb.post.findUnique({
      where: { id: p.id },
      include: { translations: true },
    })
    expect(found).not.toBeNull()
    expect(found!.status).toBe("DRAFT")
    expect(found!.publishedAt).toBeNull()
    expect(found!.translations).toHaveLength(1)
    expect(found!.translations[0].title).toBe("你好")
  })

  it("auto-fills publishedAt to ~now when status=PUBLISHED and publishedAt missing", async () => {
    const before = Date.now()
    const p = await createPost(
      {
        slug: "live",
        status: "PUBLISHED",
        translations: [zh("已发布")],
        tags: [],
      } as never,
      authorId,
    )
    const after = Date.now()
    const found = await testDb.post.findUnique({ where: { id: p.id } })
    expect(found!.status).toBe("PUBLISHED")
    expect(found!.publishedAt).not.toBeNull()
    const ts = found!.publishedAt!.getTime()
    // Should land between the bracketed window, with a 5s slack either side
    // to absorb DB clock drift.
    expect(ts).toBeGreaterThanOrEqual(before - 5000)
    expect(ts).toBeLessThanOrEqual(after + 5000)
  })

  it("throws AppError(CONFLICT) on duplicate slug", async () => {
    await createPost(
      {
        slug: "dup",
        translations: [zh("一")],
        tags: [],
      } as never,
      authorId,
    )
    await expect(
      createPost(
        {
          slug: "dup",
          translations: [zh("二")],
          tags: [],
        } as never,
        authorId,
      ),
    ).rejects.toMatchObject({ name: "AppError", code: "CONFLICT" })
  })

  it("creates Tag rows + TagsOnPosts associations from string tags", async () => {
    const p = await createPost(
      {
        slug: "with-tags",
        translations: [zh("带标签")],
        tags: ["typescript", "next-js"],
      } as never,
      authorId,
    )
    const tags = await testDb.tag.findMany({
      orderBy: { slug: "asc" },
    })
    expect(tags.map((t) => t.slug).sort()).toEqual(["next-js", "typescript"])

    const links = await testDb.tagsOnPosts.findMany({
      where: { postId: p.id },
    })
    expect(links).toHaveLength(2)
  })
})

describe("getPostById / getPostBySlug", () => {
  it("getPostById returns null for a missing id", async () => {
    expect(await getPostById("does-not-exist")).toBeNull()
  })

  it("getPostBySlug returns null for a missing slug", async () => {
    expect(await getPostBySlug("nope")).toBeNull()
  })

  it("returns the post with translations + tags when found", async () => {
    const created = await createPost(
      {
        slug: "found",
        translations: [zh("找到了")],
        tags: ["typescript"],
      } as never,
      authorId,
    )

    const byId = (await getPostById(created.id)) as {
      id: string
      slug: string
      translations: { title: string }[]
      tags: unknown[]
    } | null
    expect(byId).not.toBeNull()
    expect(byId!.slug).toBe("found")
    expect(byId!.translations.length).toBeGreaterThanOrEqual(1)
    expect(byId!.tags.length).toBeGreaterThanOrEqual(1)

    const bySlug = (await getPostBySlug("found")) as { id: string } | null
    expect(bySlug?.id).toBe(created.id)
  })

  it("getPostBySlug returns the linked column with its translations expanded", async () => {
    const col = await testDb.column.create({
      data: {
        slug: "tech",
        translations: {
          create: [
            { locale: "zh", name: "技术" },
            { locale: "en", name: "Tech" },
          ],
        },
      },
    })

    await createPost(
      {
        slug: "in-tech",
        translations: [zh("入专栏")],
        tags: [],
        columnId: col.id,
      } as never,
      authorId,
    )

    const found = await getPostBySlug("in-tech")
    expect(found).not.toBeNull()
    expect(found!.column).not.toBeNull()
    expect(Array.isArray(found!.column!.translations)).toBe(true)
    expect(found!.column!.translations.length).toBe(2)
    const zhTr = found!.column!.translations.find((t) => t.locale === "zh")
    expect(zhTr?.name).toBe("技术")
  })
})

describe("updatePost", () => {
  it("updates a translation in place (no extra row)", async () => {
    const p = await createPost(
      {
        slug: "u1",
        translations: [zh("旧标题")],
        tags: [],
      } as never,
      authorId,
    )

    await updatePost(p.id, {
      translations: [zh("新标题", "新正文")],
    } as never)

    const trs = await testDb.postTranslation.findMany({
      where: { postId: p.id },
    })
    expect(trs).toHaveLength(1)
    expect(trs[0].title).toBe("新标题")
    expect(trs[0].content).toBe("新正文")
  })

  it("auto-fills publishedAt when transitioning DRAFT → PUBLISHED with no publishedAt", async () => {
    const p = await createPost(
      {
        slug: "u2",
        status: "DRAFT",
        translations: [zh("草稿")],
        tags: [],
      } as never,
      authorId,
    )
    const before = Date.now()
    await updatePost(p.id, { status: "PUBLISHED" } as never)
    const after = Date.now()

    const found = await testDb.post.findUnique({ where: { id: p.id } })
    expect(found!.status).toBe("PUBLISHED")
    expect(found!.publishedAt).not.toBeNull()
    const ts = found!.publishedAt!.getTime()
    expect(ts).toBeGreaterThanOrEqual(before - 5000)
    expect(ts).toBeLessThanOrEqual(after + 5000)
  })

  it("respects an explicit publishedAt provided alongside DRAFT → PUBLISHED", async () => {
    const p = await createPost(
      {
        slug: "u3",
        status: "DRAFT",
        translations: [zh("草稿")],
        tags: [],
      } as never,
      authorId,
    )
    const fixed = new Date("2026-01-01T00:00:00Z")
    await updatePost(p.id, {
      status: "PUBLISHED",
      publishedAt: fixed,
    } as never)

    const found = await testDb.post.findUnique({ where: { id: p.id } })
    expect(found!.publishedAt?.toISOString()).toBe(fixed.toISOString())
  })

  it("replaces the tag set wholesale when tags is provided", async () => {
    const p = await createPost(
      {
        slug: "u4",
        translations: [zh("标签")],
        tags: ["a", "b"],
      } as never,
      authorId,
    )

    await updatePost(p.id, { tags: ["b", "c"] } as never)

    const links = await testDb.tagsOnPosts.findMany({
      where: { postId: p.id },
      include: { tag: true },
    })
    const slugs = links.map((l) => l.tag.slug).sort()
    expect(slugs).toEqual(["b", "c"])
  })

  it("throws NOT_FOUND for a non-existent id", async () => {
    await expect(
      updatePost("does-not-exist", { tags: [] } as never),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})

describe("deletePost", () => {
  it("removes the post and cascades to children", async () => {
    const p = await createPost(
      {
        slug: "del",
        translations: [zh("删除")],
        tags: ["typescript", "next-js"],
      } as never,
      authorId,
    )

    // Add a PostView and a PostLike directly so delete cascade has something
    // to chew on.
    await testDb.postView.create({
      data: {
        postId: p.id,
        visitorHash: "v1",
        dayKey: "2026-05-18",
      },
    })
    await testDb.postLike.create({
      data: {
        postId: p.id,
        visitorHash: "v1",
      },
    })

    await deletePost(p.id)

    expect(await getPostById(p.id)).toBeNull()
    expect(
      await testDb.postTranslation.findMany({ where: { postId: p.id } }),
    ).toHaveLength(0)
    expect(
      await testDb.tagsOnPosts.findMany({ where: { postId: p.id } }),
    ).toHaveLength(0)
    expect(
      await testDb.postView.findMany({ where: { postId: p.id } }),
    ).toHaveLength(0)
    expect(
      await testDb.postLike.findMany({ where: { postId: p.id } }),
    ).toHaveLength(0)

    // Tag rows themselves should NOT be deleted (only the join rows).
    const remainingTags = await testDb.tag.findMany()
    expect(remainingTags.map((t) => t.slug).sort()).toEqual([
      "next-js",
      "typescript",
    ])
  })

  it("throws NOT_FOUND when deleting a missing id", async () => {
    await expect(deletePost("does-not-exist")).rejects.toBeInstanceOf(AppError)
    await expect(deletePost("does-not-exist")).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })
})

describe("listPosts — pagination + filters", () => {
  async function seed() {
    // 5 PUBLISHED + 3 DRAFT, one of each gets a tag and a "Hello" title.
    for (let i = 0; i < 5; i++) {
      await createPost(
        {
          slug: `pub-${i}`,
          status: "PUBLISHED",
          translations: [zh(i === 0 ? "Hello World" : `已发 ${i}`)],
          tags: i === 0 ? ["next-js"] : [],
        } as never,
        authorId,
      )
    }
    for (let i = 0; i < 3; i++) {
      await createPost(
        {
          slug: `draft-${i}`,
          status: "DRAFT",
          translations: [zh(`草稿 ${i}`)],
          tags: [],
        } as never,
        authorId,
      )
    }
  }

  it("returns total=8, items.length=8 with default page/pageSize", async () => {
    await seed()
    const r = await listPosts({ page: 1, pageSize: 20 } as never, "zh")
    expect(r.total).toBe(8)
    expect(r.items.length).toBe(8)
    expect(r.page).toBe(1)
    expect(r.pageSize).toBe(20)
  })

  it("filters by status=PUBLISHED", async () => {
    await seed()
    const r = await listPosts({ status: "PUBLISHED" } as never, "zh")
    expect(r.items.length).toBe(5)
  })

  it("filters by status=DRAFT", async () => {
    await seed()
    const r = await listPosts({ status: "DRAFT" } as never, "zh")
    expect(r.items.length).toBe(3)
  })

  it("paginates with pageSize=3, page=1", async () => {
    await seed()
    const r = await listPosts({ page: 1, pageSize: 3 } as never, "zh")
    expect(r.items.length).toBe(3)
    expect(r.total).toBe(8)
  })

  it("filters by tag", async () => {
    await seed()
    // Contract uses `tag` (the brief) but agent A's schema currently uses
    // `tagSlug`. Pass both so whichever the implementation reads is satisfied.
    const r = await listPosts(
      { tag: "next-js", tagSlug: "next-js" } as never,
      "zh",
    )
    expect(r.items.length).toBe(1)
  })

  it("filters by q (title contains)", async () => {
    await seed()
    const r = await listPosts({ q: "Hello" } as never, "zh")
    expect(r.items.length).toBe(1)
  })

  it("filters by columnId", async () => {
    const col = await testDb.column.create({
      data: {
        slug: "tech",
        translations: { create: [{ locale: "zh", name: "技术" }] },
      },
    })
    await createPost(
      {
        slug: "in-col-1",
        translations: [zh("一")],
        tags: [],
        columnId: col.id,
      } as never,
      authorId,
    )
    await createPost(
      {
        slug: "in-col-2",
        translations: [zh("二")],
        tags: [],
        columnId: col.id,
      } as never,
      authorId,
    )
    await createPost(
      {
        slug: "no-col",
        translations: [zh("三")],
        tags: [],
      } as never,
      authorId,
    )

    const r = await listPosts({ columnId: col.id } as never, "zh")
    expect(r.items.length).toBe(2)
  })
})

describe("incrementPostView", () => {
  async function makePost(slug = "v"): Promise<string> {
    const p = await createPost(
      {
        slug,
        translations: [zh("浏览")],
        tags: [],
      } as never,
      authorId,
    )
    return p.id
  }

  it("first call counted=true, viewCount becomes 1", async () => {
    await makePost("v1")
    const r = await incrementPostView("v1", "hash-a", "2026-05-18")
    expect(r.counted).toBe(true)
    expect(r.viewCount).toBe(1)

    const post = await testDb.post.findUnique({ where: { slug: "v1" } })
    expect(post!.viewCount).toBe(1)
  })

  it("dedupes on (slug, visitorHash, dayKey) — second call counted=false, viewCount unchanged", async () => {
    await makePost("v2")
    await incrementPostView("v2", "hash-a", "2026-05-18")
    const r2 = await incrementPostView("v2", "hash-a", "2026-05-18")
    expect(r2.counted).toBe(false)
    expect(r2.viewCount).toBe(1)
  })

  it("counts a different visitorHash as new", async () => {
    await makePost("v3")
    await incrementPostView("v3", "hash-a", "2026-05-18")
    const r2 = await incrementPostView("v3", "hash-b", "2026-05-18")
    expect(r2.counted).toBe(true)
    expect(r2.viewCount).toBe(2)
  })

  it("counts the same visitorHash on a different dayKey as new", async () => {
    await makePost("v4")
    await incrementPostView("v4", "hash-a", "2026-05-18")
    const r2 = await incrementPostView("v4", "hash-a", "2026-05-19")
    expect(r2.counted).toBe(true)
    expect(r2.viewCount).toBe(2)
  })

  it("throws NOT_FOUND when slug is unknown", async () => {
    await expect(
      incrementPostView("ghost", "hash-a", "2026-05-18"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})
