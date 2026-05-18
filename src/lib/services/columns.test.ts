import { describe, it, expect, beforeEach, afterAll } from "vitest"
import {
  resetColumns,
  resetPostsAndUsers,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"
import {
  listColumns,
  listColumnsForLocale,
  getColumnById,
  getColumnBySlug,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
  countPostsInColumn,
} from "./columns"
import { AppError } from "@/lib/errors"

/**
 * Integration tests against the dev Postgres (port 5433, db `tzblog`).
 * Service-under-test uses `@/lib/db` which points at the same DATABASE_URL,
 * so truncating via testDb in beforeEach cleanly resets the world.
 *
 * Some cases here are expected to RED until agent A's service implementation
 * lands (see test list at bottom of file). That's by design — ECC TDD.
 */

beforeEach(async () => {
  await resetPostsAndUsers()
  await resetColumns()
})

afterAll(async () => {
  await disconnectTestDb()
})

const zh = (name: string, description?: string) => ({
  locale: "zh",
  name,
  description,
})
const en = (name: string, description?: string) => ({
  locale: "en",
  name,
  description,
})

describe("createColumn", () => {
  it("creates a column with a single zh translation and order=0", async () => {
    const c = await createColumn({
      slug: "tech",
      translations: [zh("技术")],
    })
    expect(c.id).toBeDefined()
    expect(c.slug).toBe("tech")
    expect(c.order).toBe(0)
    expect(c.translations).toHaveLength(1)
    expect(c.translations[0].locale).toBe("zh")
    expect(c.translations[0].name).toBe("技术")
  })

  it("auto-increments order to max(order)+1 on subsequent creates", async () => {
    const a = await createColumn({ slug: "a", translations: [zh("甲")] })
    const b = await createColumn({ slug: "b", translations: [zh("乙")] })
    const c = await createColumn({ slug: "c", translations: [zh("丙")] })
    expect(a.order).toBe(0)
    expect(b.order).toBe(1)
    expect(c.order).toBe(2)
  })

  it("throws AppError(CONFLICT) on duplicate slug", async () => {
    await createColumn({ slug: "dup", translations: [zh("甲")] })
    await expect(
      createColumn({ slug: "dup", translations: [zh("again")] }),
    ).rejects.toMatchObject({
      name: "AppError",
      code: "CONFLICT",
    })
  })

  it("throws AppError(VALIDATION_ERROR) when translations array is empty", async () => {
    // Defensive: even if a caller bypasses the zod schema, the service
    // itself must reject empty translations.
    await expect(
      // cast away the schema type — we are testing the runtime guard
      createColumn({ slug: "no-tr", translations: [] } as never),
    ).rejects.toBeInstanceOf(AppError)
  })
})

describe("getColumnById / getColumnBySlug", () => {
  it("getColumnById returns null for a missing id", async () => {
    expect(await getColumnById("does-not-exist")).toBeNull()
  })

  it("getColumnBySlug returns null for a missing slug", async () => {
    expect(await getColumnBySlug("nope")).toBeNull()
  })

  it("returns the column with its translations when found", async () => {
    const created = await createColumn({
      slug: "tech",
      translations: [zh("技术", "随手记")],
    })

    const byId = await getColumnById(created.id)
    expect(byId).not.toBeNull()
    expect(byId!.slug).toBe("tech")
    expect(byId!.translations).toHaveLength(1)
    expect(byId!.translations[0].name).toBe("技术")

    const bySlug = await getColumnBySlug("tech")
    expect(bySlug?.id).toBe(created.id)
  })
})

describe("updateColumn", () => {
  it("updates an existing translation in place (no extra row)", async () => {
    const c = await createColumn({
      slug: "tech",
      translations: [zh("技术")],
    })

    await updateColumn(c.id, {
      translations: [zh("技术笔记", "更新")],
    })

    const after = await testDb.columnTranslation.findMany({
      where: { columnId: c.id },
    })
    expect(after).toHaveLength(1)
    expect(after[0].name).toBe("技术笔记")
    expect(after[0].description).toBe("更新")
  })

  it("throws CONFLICT when changing slug to one that already exists", async () => {
    const a = await createColumn({ slug: "a", translations: [zh("甲")] })
    await createColumn({ slug: "b", translations: [zh("乙")] })

    await expect(
      updateColumn(a.id, { slug: "b" }),
    ).rejects.toMatchObject({ code: "CONFLICT" })
  })

  it("throws NOT_FOUND for a non-existent id", async () => {
    await expect(
      updateColumn("does-not-exist", { slug: "whatever" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})

describe("deleteColumn", () => {
  it("removes the column and cascades to ColumnTranslation", async () => {
    const c = await createColumn({
      slug: "tech",
      translations: [zh("技术"), en("Tech")],
    })

    await deleteColumn(c.id)

    expect(await getColumnById(c.id)).toBeNull()

    const orphans = await testDb.columnTranslation.findMany({
      where: { columnId: c.id },
    })
    expect(orphans).toHaveLength(0)
  })

  it("throws NOT_FOUND when deleting a missing id", async () => {
    await expect(
      deleteColumn("does-not-exist"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})

describe("reorderColumns", () => {
  it("rewrites order to match the supplied id sequence", async () => {
    const a = await createColumn({ slug: "a", translations: [zh("甲")] })
    const b = await createColumn({ slug: "b", translations: [zh("乙")] })
    const c = await createColumn({ slug: "c", translations: [zh("丙")] })

    await reorderColumns([c.id, a.id, b.id])

    const list = await listColumns()
    expect(list.map((x) => x.id)).toEqual([c.id, a.id, b.id])
    expect(list.map((x) => x.order)).toEqual([0, 1, 2])
  })
})

describe("listColumns / listColumnsForLocale", () => {
  it("listColumns returns rows in ascending order", async () => {
    const a = await createColumn({ slug: "a", translations: [zh("甲")] })
    const b = await createColumn({ slug: "b", translations: [zh("乙")] })
    const c = await createColumn({ slug: "c", translations: [zh("丙")] })

    const list = await listColumns()
    expect(list.map((x) => x.id)).toEqual([a.id, b.id, c.id])
  })

  it("listColumnsForLocale picks the right translation per locale", async () => {
    await createColumn({
      slug: "tech",
      translations: [zh("技术"), en("Tech")],
    })

    const zhList = await listColumnsForLocale("zh")
    expect(zhList).toHaveLength(1)
    expect(zhList[0].name).toBe("技术")

    const enList = await listColumnsForLocale("en")
    expect(enList).toHaveLength(1)
    expect(enList[0].name).toBe("Tech")
  })

  // The fallback policy hasn't been pinned down by agent A yet; the
  // spec leaves it open between "fallback to zh" and "return null".
  // Skip until the contract is firm — turning this on is a one-liner.
  it.skip("listColumnsForLocale falls back when locale is missing (TODO: confirm policy with agent A)", async () => {
    await createColumn({ slug: "tech", translations: [zh("技术")] })
    const enList = await listColumnsForLocale("en")
    // Either fallback to zh or null name — assert whichever agent A picks.
    expect(enList[0].name).toBe("技术")
  })
})

describe("countPostsInColumn", () => {
  it("returns the number of posts whose columnId matches", async () => {
    const col = await createColumn({
      slug: "tech",
      translations: [zh("技术")],
    })

    const user = await testDb.user.create({
      data: {
        email: "test@example.com",
        name: "Tester",
        role: "ADMIN",
      },
    })

    // Three posts attached, one orphan.
    for (let i = 0; i < 3; i++) {
      await testDb.post.create({
        data: {
          slug: `p-${i}`,
          authorId: user.id,
          columnId: col.id,
          status: "PUBLISHED",
          translations: {
            create: [{ locale: "zh", title: `帖子 ${i}`, content: "x" }],
          },
        },
      })
    }
    await testDb.post.create({
      data: {
        slug: "orphan",
        authorId: user.id,
        status: "DRAFT",
        translations: {
          create: [{ locale: "zh", title: "orphan", content: "x" }],
        },
      },
    })

    expect(await countPostsInColumn(col.id)).toBe(3)
  })

  it("returns 0 for a column with no posts", async () => {
    const col = await createColumn({
      slug: "empty",
      translations: [zh("空")],
    })
    expect(await countPostsInColumn(col.id)).toBe(0)
  })
})
