import { describe, it, expect, beforeEach, afterAll } from "vitest"

import {
  resetAll,
  testDb,
  disconnectTestDb,
} from "../../../../tests/helpers/db"
import { POST } from "./route"

beforeEach(async () => {
  await resetAll()
  await testDb.pageView.deleteMany()
})

afterAll(async () => {
  await disconnectTestDb()
})

function mkReq(
  body: unknown,
  opts: { dnt?: boolean; ip?: string; ua?: string } = {},
): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": opts.ip ?? "10.0.0.1",
    "user-agent": opts.ua ?? "test-UA",
  }
  if (opts.dnt) headers.dnt = "1"
  return new Request("http://localhost/api/track", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
}

describe("POST /api/track", () => {
  it("204 + inserts PageView (SPEC-A-A-1)", async () => {
    const res = await POST(mkReq({ path: "/", referrer: "" }))
    expect(res.status).toBe(204)
    const all = await testDb.pageView.findMany()
    expect(all).toHaveLength(1)
    expect(all[0].path).toBe("/")
    expect(all[0].userAgent).toBe("test-UA")
  })

  it("204 + DB unchanged on DNT header (SPEC-A-A-2)", async () => {
    const res = await POST(mkReq({ path: "/" }, { dnt: true }))
    expect(res.status).toBe(204)
    expect(await testDb.pageView.count()).toBe(0)
  })

  it("204 + DB unchanged on path blacklist (/admin, /api, /login) (SPEC-A-A-3)", async () => {
    for (const p of ["/admin/entries", "/api/track", "/login"]) {
      const res = await POST(mkReq({ path: p }))
      expect(res.status).toBe(204)
    }
    expect(await testDb.pageView.count()).toBe(0)
  })

  it("429 after 60 requests (SPEC-A-A-4)", async () => {
    const lockedOpts = { ip: "192.168.88.88", ua: "rate-limit-UA" }
    for (let i = 0; i < 60; i++) {
      const res = await POST(mkReq({ path: `/${i}` }, lockedOpts))
      expect(res.status).toBe(204)
    }

    const res = await POST(mkReq({ path: "/61" }, lockedOpts))
    expect(res.status).toBe(429)
    expect(await testDb.pageView.count()).toBe(60)
  })

  it("400 on invalid path (SPEC-A-A-5)", async () => {
    const res = await POST(mkReq({ path: "no-slash" }))
    expect(res.status).toBe(400)
    expect(await testDb.pageView.count()).toBe(0)
  })
})
