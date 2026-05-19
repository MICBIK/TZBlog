import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"
import "dotenv/config"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import { resetAll, ensureTestUser, testDb, disconnectTestDb } from "../../../../../../tests/helpers/db"
import { DELETE } from "./route"

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

describe("DELETE /api/admin/media/[id]", () => {
  it("§5.9 returns 200 with data.id", async () => {
    const created = await testDb.media.create({
      data: {
        key: "2026/05/delete-me.png",
        url: "/uploads/2026/05/delete-me.png",
        filename: "delete-me.png",
        mimeType: "image/png",
        size: 100,
        uploadedBy: authorId,
      },
    })

    const ctx = { params: Promise.resolve({ id: created.id }) }
    const req = new Request(`http://localhost/api/admin/media/${created.id}`, {
      method: "DELETE",
    })
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(created.id)

    const row = await testDb.media.findUnique({ where: { id: created.id } })
    expect(row).toBeNull()
  })
})