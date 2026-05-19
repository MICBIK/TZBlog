import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"
import "dotenv/config"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import { resetAll, ensureTestUser, testDb, disconnectTestDb } from "../../../../../tests/helpers/db"
import { GET } from "./route"

let authorId: string

beforeEach(async () => {
  await resetAll()
  await testDb.$executeRawUnsafe(`TRUNCATE TABLE "Media" RESTART IDENTITY CASCADE`)
  authorId = await ensureTestUser()
  ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: authorId, email: "test@x.com" },
    expires: new Date(Date.now() + 86400_000).toISOString(),
  })
})

afterAll(async () => {
  await disconnectTestDb()
})

describe("GET /api/admin/media", () => {
  it("§5.6 returns first 12 with meta", async () => {
    const req = new Request("http://localhost/api/admin/media")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta).toBeDefined()
    expect(body.meta.page).toBe(1)
    expect(body.meta.pageSize).toBe(12)
    expect(body.meta.total).toBeDefined()
  })

  it("§5.7 respects ?page=&pageSize=", async () => {
    // seed 5 rows
    for (let i = 0; i < 5; i++) {
      await testDb.media.create({
        data: {
          key: `2026/05/test-${i}.png`,
          url: `/uploads/2026/05/test-${i}.png`,
          filename: `test-${i}.png`,
          mimeType: "image/png",
          size: 100,
          uploadedBy: authorId,
        },
      })
    }

    const req = new Request("http://localhost/api/admin/media?page=2&pageSize=2")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.meta.page).toBe(2)
    expect(body.meta.pageSize).toBe(2)
    expect(body.data.length).toBe(2)
  })

  it("§5.8 pageSize > 100 returns 400", async () => {
    const req = new Request("http://localhost/api/admin/media?pageSize=200")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })
})