import { execFileSync } from "node:child_process"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
} from "../../../../../tests/helpers/db"

type ChannelsRoute = {
  GET: (req: Request) => Promise<Response>
  POST: (req: Request) => Promise<Response>
}

let adminId: string

beforeEach(async () => {
  await resetAll()
  adminId = await ensureTestUser("admin@example.com")
  ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: adminId, email: "admin@example.com" },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  })
  execFileSync("pnpm", ["db:seed"], {
    cwd: process.cwd(),
    stdio: "pipe",
  })
})

afterAll(async () => {
  await disconnectTestDb()
})

describe("GET /api/admin/channels", () => {
  it("returns seeded channels ordered by order", async () => {
    const { GET } = await loadRoute()

    const res = await GET(new Request("http://localhost/api/admin/channels"))
    const body = (await res.json()) as {
      data: Array<{
        slug: string
        order: number
        kind: string
        layout: string
      }>
    }

    expect(res.status).toBe(200)
    expect(body.data.map((channel) => channel.slug)).toEqual([
      "articles",
      "stream",
      "notes",
      "cards",
      "pulse",
      "guestbook",
    ])
    expect(body.data.map((channel) => channel.kind)).toEqual([
      "ARTICLES",
      "STREAM",
      "NOTES",
      "ARTICLES",
      "STREAM",
      "GUESTBOOK",
    ])
    expect(body.data.map((channel) => channel.order)).toEqual([0, 1, 2, 3, 4, 99])
  })
})

describe("POST /api/admin/channels", () => {
  it("conflictSlugReturns409", async () => {
    const { POST } = await loadRoute()

    const res = await POST(
      new Request("http://localhost/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "articles",
          kind: "ARTICLES",
          layout: "CHRONICLE",
          enabled: true,
          translations: [{ locale: "zh", name: "文章", description: null }],
        }),
      }),
    )
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error.code).toBe("CONFLICT")
  })
})

async function loadRoute(): Promise<ChannelsRoute> {
  const routePath = join(process.cwd(), "src/app/api/admin/channels/route.ts")
  return import(pathToFileURL(routePath).href) as Promise<ChannelsRoute>
}
