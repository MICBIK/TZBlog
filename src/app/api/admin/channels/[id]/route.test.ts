import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/lib/auth"
import {
  disconnectTestDb,
  ensureTestUser,
  resetAll,
  testDb,
} from "../../../../../../tests/helpers/db"

type ChannelItemRoute = {
  DELETE: (
    req: Request,
    ctx: { params: Promise<{ id: string }> },
  ) => Promise<Response>
}

let adminId: string

beforeEach(async () => {
  await resetAll()
  adminId = await ensureTestUser("admin@example.com")
  ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: adminId, email: "admin@example.com" },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  })
})

afterAll(async () => {
  await disconnectTestDb()
})

describe("DELETE /api/admin/channels/[id]", () => {
  it("deleteCascadesToEntries", async () => {
    const { DELETE } = await loadRoute()
    const channel = await testDb.channel.create({
      data: {
        slug: "delete-me",
        order: 3,
        enabled: true,
        kind: "STREAM",
        layout: "FEED",
        translations: {
          create: [{ locale: "zh", name: "待删除频道", description: null }],
        },
      },
    })
    const series = await testDb.series.create({
      data: {
        slug: "ops-series",
        channelId: channel.id,
        translations: {
          create: [{ locale: "zh", name: "运维系列", description: null }],
        },
      },
    })
    const entry = await testDb.entry.create({
      data: {
        slug: "ops-entry",
        channelId: channel.id,
        authorId: adminId,
        kind: "NOTE",
        status: "PUBLISHED",
        publishedAt: new Date(),
        body: "entry body",
        seriesId: series.id,
        seriesOrder: 1,
        translations: {
          create: [{ locale: "zh", title: "运维记录", excerpt: "摘要" }],
        },
      },
    })

    expect(await testDb.channelTranslation.count({ where: { channelId: channel.id } })).toBe(1)
    expect(await testDb.series.count({ where: { channelId: channel.id } })).toBe(1)
    expect(await testDb.seriesTranslation.count({ where: { seriesId: series.id } })).toBe(1)
    expect(await testDb.entry.count({ where: { channelId: channel.id } })).toBe(1)
    expect(await testDb.entryTranslation.count({ where: { entryId: entry.id } })).toBe(1)

    const res = await DELETE(request(channel.id), ctx(channel.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.id).toBe(channel.id)
    expect(await testDb.channel.findUnique({ where: { id: channel.id } })).toBeNull()
    expect(await testDb.channelTranslation.count({ where: { channelId: channel.id } })).toBe(0)
    expect(await testDb.series.count({ where: { channelId: channel.id } })).toBe(0)
    expect(await testDb.seriesTranslation.count({ where: { seriesId: series.id } })).toBe(0)
    expect(await testDb.entry.count({ where: { channelId: channel.id } })).toBe(0)
    expect(await testDb.entryTranslation.count({ where: { entryId: entry.id } })).toBe(0)
  })
})

async function loadRoute(): Promise<ChannelItemRoute> {
  const routePath = join(process.cwd(), "src/app/api/admin/channels/[id]/route.ts")
  return import(pathToFileURL(routePath).href) as Promise<ChannelItemRoute>
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}

function request(id: string) {
  return new Request(`http://localhost/api/admin/channels/${id}`, {
    method: "DELETE",
  })
}
