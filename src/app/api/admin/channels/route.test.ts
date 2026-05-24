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
      "guestbook",
    ])
    expect(body.data.map((channel) => channel.kind)).toEqual([
      "ARTICLES",
      "STREAM",
      "GUESTBOOK",
    ])
    expect(body.data.map((channel) => channel.order)).toEqual([0, 1, 99])
  })
})

async function loadRoute(): Promise<ChannelsRoute> {
  const routePath = join(process.cwd(), "src/app/api/admin/channels/route.ts")
  return import(pathToFileURL(routePath).href) as Promise<ChannelsRoute>
}
