import { describe, it, expect } from "vitest"

import { commentCreateSchema } from "./comment"

const validPayload = {
  authorName: "Alice",
  authorEmail: "alice@example.com",
  content: "great post!",
} as const

describe("commentCreateSchema (SPEC-D3-C-6)", () => {
  it("accepts a minimal valid payload (authorName + authorEmail + content)", () => {
    expect(() => commentCreateSchema.parse(validPayload)).not.toThrow()
  })

  it("rejects empty authorName", () => {
    expect(() =>
      commentCreateSchema.parse({ ...validPayload, authorName: "" }),
    ).toThrow()
  })

  it("rejects authorName over 60 chars", () => {
    expect(() =>
      commentCreateSchema.parse({
        ...validPayload,
        authorName: "a".repeat(61),
      }),
    ).toThrow()
  })

  it("rejects authorEmail with invalid format", () => {
    expect(() =>
      commentCreateSchema.parse({
        ...validPayload,
        authorEmail: "not-an-email",
      }),
    ).toThrow()
  })

  it("rejects empty content", () => {
    expect(() =>
      commentCreateSchema.parse({ ...validPayload, content: "" }),
    ).toThrow()
  })

  it("rejects content over 1000 chars", () => {
    expect(() =>
      commentCreateSchema.parse({
        ...validPayload,
        content: "x".repeat(1001),
      }),
    ).toThrow()
  })

  it("accepts content exactly 1000 chars", () => {
    expect(() =>
      commentCreateSchema.parse({
        ...validPayload,
        content: "x".repeat(1000),
      }),
    ).not.toThrow()
  })

  it("rejects invalid authorWebsite URL", () => {
    expect(() =>
      commentCreateSchema.parse({
        ...validPayload,
        authorWebsite: "not-a-url",
      }),
    ).toThrow()
  })

  it("accepts valid https authorWebsite URL", () => {
    expect(() =>
      commentCreateSchema.parse({
        ...validPayload,
        authorWebsite: "https://example.com",
      }),
    ).not.toThrow()
  })

  it("accepts undefined / missing authorWebsite (optional)", () => {
    expect(() =>
      commentCreateSchema.parse({ ...validPayload, authorWebsite: undefined }),
    ).not.toThrow()
    expect(() => commentCreateSchema.parse(validPayload)).not.toThrow()
  })

  it("accepts undefined / missing parentId (optional)", () => {
    expect(() =>
      commentCreateSchema.parse({ ...validPayload, parentId: undefined }),
    ).not.toThrow()
    expect(() => commentCreateSchema.parse(validPayload)).not.toThrow()
  })

  it("accepts a non-empty string parentId", () => {
    expect(() =>
      commentCreateSchema.parse({ ...validPayload, parentId: "abc123xyz" }),
    ).not.toThrow()
  })

  it("rejects an empty-string parentId", () => {
    expect(() =>
      commentCreateSchema.parse({ ...validPayload, parentId: "" }),
    ).toThrow()
  })
})
