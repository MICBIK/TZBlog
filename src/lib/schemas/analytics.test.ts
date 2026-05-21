import { describe, it, expect } from "vitest"

import { trackPayloadSchema } from "./analytics"

describe("trackPayloadSchema (SPEC-A-S-1..3)", () => {
  it("accepts minimal valid payload (path only)", () => {
    expect(() => trackPayloadSchema.parse({ path: "/" })).not.toThrow()
  })

  it("accepts path + empty referrer", () => {
    expect(() =>
      trackPayloadSchema.parse({ path: "/posts/hello", referrer: "" }),
    ).not.toThrow()
  })

  it("accepts path + valid url referrer", () => {
    expect(() =>
      trackPayloadSchema.parse({
        path: "/",
        referrer: "https://google.com",
      }),
    ).not.toThrow()
  })

  it("rejects empty path", () => {
    expect(() => trackPayloadSchema.parse({ path: "" })).toThrow()
  })

  it("rejects path without leading slash", () => {
    expect(() =>
      trackPayloadSchema.parse({ path: "no-slash" }),
    ).toThrow()
  })

  it("rejects path over 500 chars", () => {
    expect(() =>
      trackPayloadSchema.parse({ path: "/" + "x".repeat(500) }),
    ).toThrow()
  })

  it("rejects non-url referrer when present", () => {
    expect(() =>
      trackPayloadSchema.parse({ path: "/", referrer: "not-a-url" }),
    ).toThrow()
  })

  it("rejects referrer over 500 chars", () => {
    expect(() =>
      trackPayloadSchema.parse({
        path: "/",
        referrer: "https://" + "x".repeat(500) + ".com",
      }),
    ).toThrow()
  })

  it("treats missing referrer as undefined (optional)", () => {
    const parsed = trackPayloadSchema.parse({ path: "/about" })
    expect(parsed).toEqual({ path: "/about" })
  })
})
