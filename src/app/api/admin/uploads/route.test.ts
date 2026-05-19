import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import { resetAll, ensureTestUser, testDb, disconnectTestDb } from "../../../../../tests/helpers/db"
import { POST } from "./route"

let authorId: string

// 1x1 real PNG (image-size readable)
const REAL_PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
)

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

describe("POST /api/admin/uploads", () => {
  it("§5.1 returns 401 without session", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const fd = new FormData()
    fd.set("file", new File([new Uint8Array(8)], "test.png", { type: "image/png" }))
    const req = new Request("http://localhost/api/admin/uploads", {
      method: "POST",
      body: fd,
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe("UNAUTHORIZED")
  })

  it("§5.2 returns 400 when file field missing", async () => {
    const fd = new FormData()
    fd.set("other", "x")
    const req = new Request("http://localhost/api/admin/uploads", {
      method: "POST",
      body: fd,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("§5.3 persists Media row for valid png", async () => {
    const fd = new FormData()
    fd.set("file", new File([REAL_PNG_1X1], "test.png", { type: "image/png" }))
    const req = new Request("http://localhost/api/admin/uploads", {
      method: "POST",
      body: fd,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBeDefined()
    expect(body.data.url).toMatch(/^\/uploads\//)

    const row = await testDb.media.findUnique({ where: { id: body.data.id } })
    expect(row).not.toBeNull()
    expect(row!.uploadedBy).toBe(authorId)
  })

  it("§5.4 response contains data.{id,url,filename,mimeType,size,width,height,createdAt}", async () => {
    const fd = new FormData()
    fd.set("file", new File([REAL_PNG_1X1], "test.png", { type: "image/png" }))
    const req = new Request("http://localhost/api/admin/uploads", {
      method: "POST",
      body: fd,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveProperty("id")
    expect(typeof body.data.id).toBe("string")
    expect(body.data).toHaveProperty("url")
    expect(typeof body.data.url).toBe("string")
    expect(body.data).toHaveProperty("filename")
    expect(typeof body.data.filename).toBe("string")
    expect(body.data).toHaveProperty("mimeType")
    expect(typeof body.data.mimeType).toBe("string")
    expect(body.data).toHaveProperty("size")
    expect(typeof body.data.size).toBe("number")
    expect(body.data).toHaveProperty("width")
    expect(body.data).toHaveProperty("height")
    expect(body.data).toHaveProperty("createdAt")
    expect(typeof body.data.createdAt).toBe("string")
  })
})