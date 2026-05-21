import { render, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AnalyticsBeacon } from "./AnalyticsBeacon"

const mocks = vi.hoisted(() => ({
  pathname: "/" as string,
  sendBeacon: vi.fn(),
  fetch: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.pathname = "/"
  mocks.sendBeacon.mockReturnValue(true)
  mocks.fetch.mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal("navigator", {
    sendBeacon: mocks.sendBeacon,
    doNotTrack: "0",
    userAgent: "jsdom-UA",
  })
  vi.stubGlobal("fetch", mocks.fetch)
  Object.defineProperty(document, "referrer", {
    value: "https://google.com",
    configurable: true,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("<AnalyticsBeacon /> SPEC-A-B-1..4", () => {
  it("mount + path fires sendBeacon with body (SPEC-A-B-1)", async () => {
    render(<AnalyticsBeacon />)

    await waitFor(() => {
      expect(mocks.sendBeacon).toHaveBeenCalledTimes(1)
    })

    const [url, blob] = mocks.sendBeacon.mock.calls[0] as [string, Blob]
    expect(url).toBe("/api/track")
    expect(blob).toBeInstanceOf(Blob)
    const text = await blob.text()
    const parsed = JSON.parse(text) as { path: string; referrer: string }
    expect(parsed.path).toBe("/")
    expect(parsed.referrer).toBe("https://google.com")
  })

  it("admin path skips sendBeacon (SPEC-A-B-2)", async () => {
    mocks.pathname = "/admin/comments"
    render(<AnalyticsBeacon />)
    // 等一会儿让 effect 跑完
    await new Promise((r) => setTimeout(r, 50))
    expect(mocks.sendBeacon).not.toHaveBeenCalled()
  })

  it("login path skips sendBeacon (SPEC-A-B-2)", async () => {
    mocks.pathname = "/login"
    render(<AnalyticsBeacon />)
    await new Promise((r) => setTimeout(r, 50))
    expect(mocks.sendBeacon).not.toHaveBeenCalled()
  })

  it("DNT navigator.doNotTrack='1' skips (SPEC-A-B-3)", async () => {
    vi.stubGlobal("navigator", {
      sendBeacon: mocks.sendBeacon,
      doNotTrack: "1",
      userAgent: "jsdom-UA",
    })
    render(<AnalyticsBeacon />)
    await new Promise((r) => setTimeout(r, 50))
    expect(mocks.sendBeacon).not.toHaveBeenCalled()
  })

  it("sendBeacon unavailable → fetch keepalive fallback (SPEC-A-B-4)", async () => {
    vi.stubGlobal("navigator", {
      doNotTrack: "0",
      userAgent: "jsdom-UA",
    })
    render(<AnalyticsBeacon />)

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/track",
        expect.objectContaining({
          method: "POST",
          keepalive: true,
        }),
      )
    })
  })
})
