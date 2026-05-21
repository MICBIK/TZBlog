import { describe, it, expect, beforeEach, afterAll } from "vitest"

import {
  resetAll,
  testDb,
  disconnectTestDb,
} from "../../../tests/helpers/db"
import { recordPageView } from "./analytics"

beforeEach(async () => {
  await resetAll()
  // PageView 不在 resetAll 列表内（其无 FK 依赖），手动清空
  await testDb.pageView.deleteMany()
})

afterAll(async () => {
  await disconnectTestDb()
})

describe("recordPageView", () => {
  it("inserts a PageView row with parsed UA + referrer (SPEC-A-V-1)", async () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    const before = Date.now()
    await recordPageView({
      path: "/",
      visitorHash: "v1",
      ua,
      referrer: "https://google.com",
    })
    const after = Date.now()

    const all = await testDb.pageView.findMany()
    expect(all).toHaveLength(1)
    const row = all[0]
    expect(row.path).toBe("/")
    expect(row.visitorHash).toBe("v1")
    expect(row.userAgent).toBe(ua)
    expect(row.device).toBe("desktop")
    expect(row.browser).toBe("Chrome")
    expect(row.os).toBe("macOS")
    expect(row.referrer).toBe("https://google.com")
    expect(row.createdAt.getTime()).toBeGreaterThanOrEqual(before - 5000)
    expect(row.createdAt.getTime()).toBeLessThanOrEqual(after + 5000)
  })

  it("treats missing referrer as null (SPEC-A-V-2)", async () => {
    await recordPageView({
      path: "/posts/hi",
      visitorHash: "v2",
      ua: "Mozilla/5.0 (X11; Linux x86_64) Firefox/100",
    })

    const all = await testDb.pageView.findMany()
    expect(all).toHaveLength(1)
    expect(all[0].path).toBe("/posts/hi")
    expect(all[0].referrer).toBeNull()
    expect(all[0].browser).toBe("Firefox")
    expect(all[0].os).toBe("Linux")
  })

  it("treats empty-string referrer as null (alignment with form layer)", async () => {
    await recordPageView({
      path: "/about",
      visitorHash: "v3",
      ua: "UA",
      referrer: "",
    })

    const all = await testDb.pageView.findMany()
    expect(all).toHaveLength(1)
    expect(all[0].referrer).toBeNull()
  })
})
