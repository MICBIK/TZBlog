import { describe, it, expect } from "vitest"
import {
  getDailySalt,
  getClientIp,
  getVisitorHash,
  parseUserAgent,
} from "./visitor"

function makeReq(headers: Record<string, string>): Request {
  return new Request("http://localhost/", { headers })
}

describe("getDailySalt", () => {
  it("returns YYYY-MM-DD format", () => {
    const salt = getDailySalt(new Date("2026-05-18T10:30:00Z"))
    expect(salt).toBe("2026-05-18")
  })

  it("uses UTC date slice", () => {
    expect(getDailySalt(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01")
    expect(getDailySalt(new Date("2026-12-31T23:59:59Z"))).toBe("2026-12-31")
  })

  it("matches YYYY-MM-DD pattern", () => {
    expect(getDailySalt()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe("getClientIp", () => {
  it("prefers X-Forwarded-For over X-Real-IP", () => {
    const req = makeReq({
      "x-forwarded-for": "1.2.3.4",
      "x-real-ip": "5.6.7.8",
    })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("uses first entry of X-Forwarded-For (comma list)", () => {
    const req = makeReq({ "x-forwarded-for": "1.2.3.4, 9.9.9.9, 8.8.8.8" })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })

  it("falls back to X-Real-IP when XFF missing", () => {
    const req = makeReq({ "x-real-ip": "5.6.7.8" })
    expect(getClientIp(req)).toBe("5.6.7.8")
  })

  it("returns 0.0.0.0 when no headers", () => {
    const req = makeReq({})
    expect(getClientIp(req)).toBe("0.0.0.0")
  })

  it("trims whitespace", () => {
    const req = makeReq({ "x-forwarded-for": "  1.2.3.4  " })
    expect(getClientIp(req)).toBe("1.2.3.4")
  })
})

describe("getVisitorHash", () => {
  const ua = "Mozilla/5.0 Chrome/120"

  it("is stable for same IP+UA+salt", () => {
    const req1 = makeReq({ "x-forwarded-for": "1.2.3.4", "user-agent": ua })
    const req2 = makeReq({ "x-forwarded-for": "1.2.3.4", "user-agent": ua })
    const h1 = getVisitorHash(req1, "2026-05-18")
    const h2 = getVisitorHash(req2, "2026-05-18")
    expect(h1).toBe(h2)
  })

  it("changes when IP changes", () => {
    const r1 = makeReq({ "x-forwarded-for": "1.2.3.4", "user-agent": ua })
    const r2 = makeReq({ "x-forwarded-for": "9.9.9.9", "user-agent": ua })
    expect(getVisitorHash(r1, "s")).not.toBe(getVisitorHash(r2, "s"))
  })

  it("changes when UA changes", () => {
    const r1 = makeReq({ "x-forwarded-for": "1.2.3.4", "user-agent": "A" })
    const r2 = makeReq({ "x-forwarded-for": "1.2.3.4", "user-agent": "B" })
    expect(getVisitorHash(r1, "s")).not.toBe(getVisitorHash(r2, "s"))
  })

  it("changes when salt changes", () => {
    const r = makeReq({ "x-forwarded-for": "1.2.3.4", "user-agent": ua })
    expect(getVisitorHash(r, "2026-05-18")).not.toBe(
      getVisitorHash(r, "2026-05-19"),
    )
  })

  it("returns 64-char hex (sha256)", () => {
    const r = makeReq({ "x-forwarded-for": "1.2.3.4", "user-agent": ua })
    expect(getVisitorHash(r)).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe("parseUserAgent", () => {
  it("identifies Chrome on Windows desktop", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    expect(parseUserAgent(ua)).toEqual({
      device: "desktop",
      browser: "Chrome",
      os: "Windows",
    })
  })

  it("identifies Safari on iPhone", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    const r = parseUserAgent(ua)
    expect(r.device).toBe("mobile")
    expect(r.browser).toBe("Safari")
    expect(r.os).toBe("iOS")
  })

  it("identifies Edge on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
    expect(parseUserAgent(ua)).toEqual({
      device: "desktop",
      browser: "Edge",
      os: "macOS",
    })
  })

  it("identifies Firefox on Linux", () => {
    const ua = "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0"
    expect(parseUserAgent(ua)).toEqual({
      device: "desktop",
      browser: "Firefox",
      os: "Linux",
    })
  })

  it("identifies iPad as tablet", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    const r = parseUserAgent(ua)
    expect(r.device).toBe("tablet")
    expect(r.os).toBe("iOS")
  })

  it("returns unknowns for empty UA", () => {
    expect(parseUserAgent("")).toEqual({
      device: "desktop",
      browser: "unknown",
      os: "unknown",
    })
  })

  it("identifies Chrome on Android mobile", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    const r = parseUserAgent(ua)
    expect(r.device).toBe("mobile")
    expect(r.browser).toBe("Chrome")
    expect(r.os).toBe("Android")
  })
})
