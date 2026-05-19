import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from "vitest"
import { mkdtemp, rm } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

import { resetAll, ensureTestUser, testDb, disconnectTestDb } from "../../../tests/helpers/db"
import { LocalDiskStorage } from "@/lib/storage"
import { createMedia, listMedia, deleteMedia } from "./media"

// ─── test DB + upload dir setup ────────────────────────────────────────────

let authorId: string
let tmpDir: string
let testStorage: LocalDiskStorage

beforeEach(async () => {
  await resetAll()
  await testDb.$executeRawUnsafe(`TRUNCATE TABLE "Media" RESTART IDENTITY CASCADE`)
  authorId = await ensureTestUser()
  tmpDir = await mkdtemp(join(tmpdir(), "tzblog-media-svc-"))
  testStorage = new LocalDiskStorage({ uploadDir: tmpDir, publicUrlPrefix: "/uploads" })
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

afterAll(async () => {
  await disconnectTestDb()
})

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function makeInput(overrides: Partial<MediaCreateInput> = {}): MediaCreateInput {
  return {
    filename: "test.png",
    mimeType: "image/png",
    body: PNG,
    size: PNG.length,
    uploadedBy: authorId,
    ...overrides,
  }
}

type MediaCreateInput = Parameters<typeof createMedia>[0]

// ─── 4.1 createMedia end-to-end ────────────────────────────────────────────

describe("createMedia", () => {
  it("writes file then DB row", async () => {
    const result = await createMedia(makeInput(), testStorage)
    expect(result.id).toBeDefined()
    expect(result.url).toMatch(/^\/uploads\//)
    const row = await testDb.media.findUnique({ where: { id: result.id } })
    expect(row).not.toBeNull()
  })

  // 4.2 key format
  it("assembles key as yyyy/MM/<cuid>.<ext>", async () => {
    const result = await createMedia(makeInput(), testStorage)
    expect(result.key).toMatch(/^\d{4}\/\d{2}\/[a-z0-9]+\.png$/)
  })

  // 4.3 rollback on DB failure
  it("rolls back physical file when DB insert fails", async () => {
    const deleteSpy = vi.spyOn(testStorage, "delete")
    const { db } = await import("@/lib/db")
    vi.spyOn(db.media, "create").mockRejectedValueOnce(new Error("DB error"))

    await expect(createMedia(makeInput(), testStorage)).rejects.toThrow("DB error")
    expect(deleteSpy).toHaveBeenCalledOnce()
    vi.restoreAllMocks()
  })
})

// ─── 4.4 listMedia ──────────────────────────────────────────────────────────

describe("listMedia", () => {
  it("returns paginated rows sorted by createdAt desc", async () => {
    for (let i = 0; i < 5; i++) {
      await createMedia(makeInput({ filename: `img${i}.png` }), testStorage)
    }
    const r = await listMedia({ page: 1, pageSize: 3 })
    expect(r.total).toBe(5)
    expect(r.items).toHaveLength(3)
    expect(r.page).toBe(1)
    expect(r.pageSize).toBe(3)
  })
})

// ─── 4.5-4.7 deleteMedia ────────────────────────────────────────────────────

describe("deleteMedia", () => {
  it("removes row and calls storage.delete", async () => {
    const deleteSpy = vi.spyOn(testStorage, "delete")
    const created = await createMedia(makeInput(), testStorage)
    await deleteMedia(created.id, testStorage)

    expect(await testDb.media.findUnique({ where: { id: created.id } })).toBeNull()
    expect(deleteSpy).toHaveBeenCalledWith(created.key)
  })

  it("throws NOT_FOUND for missing id", async () => {
    await expect(deleteMedia("non-existent-id", testStorage)).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })

  it("succeeds when file missing on disk", async () => {
    const created = await createMedia(makeInput(), testStorage)
    await testStorage.delete(created.key) // file gone
    await expect(deleteMedia(created.id, testStorage)).resolves.toBeUndefined()
    expect(await testDb.media.findUnique({ where: { id: created.id } })).toBeNull()
  })

  it("propagates non-idempotent storage errors (e.g. EACCES)", async () => {
    const created = await createMedia(makeInput(), testStorage)
    vi.spyOn(testStorage, "delete").mockRejectedValueOnce(
      Object.assign(new Error("EACCES: permission denied"), { code: "EACCES" }),
    )
    await expect(deleteMedia(created.id, testStorage)).rejects.toThrow("EACCES")
    vi.restoreAllMocks()
  })
})
