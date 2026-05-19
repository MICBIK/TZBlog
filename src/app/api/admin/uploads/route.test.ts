import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import { resetAll, ensureTestUser, testDb, disconnectTestDb } from "../../../../../tests/helpers/db"
import { POST } from "./route"

beforeEach(async () => {
  await resetAll()
  await testDb.$executeRawUnsafe(`TRUNCATE TABLE "Media" RESTART IDENTITY CASCADE`)
  const authorId = await ensureTestUser()
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
})