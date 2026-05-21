import { describe, it, expect } from "vitest"

import {
  commentBulkUpdateSchema,
  commentCreateSchema,
  commentFilterSchema,
  commentStatusUpdateSchema,
} from "./comment"

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

describe("commentFilterSchema (admin)", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(() => commentFilterSchema.parse({})).not.toThrow()
  })

  it("accepts valid status enum", () => {
    expect(() => commentFilterSchema.parse({ status: "PENDING" })).not.toThrow()
    expect(() => commentFilterSchema.parse({ status: "APPROVED" })).not.toThrow()
    expect(() => commentFilterSchema.parse({ status: "SPAM" })).not.toThrow()
    expect(() => commentFilterSchema.parse({ status: "REJECTED" })).not.toThrow()
  })

  it("rejects invalid status", () => {
    expect(() =>
      commentFilterSchema.parse({ status: "UNKNOWN" }),
    ).toThrow()
  })

  it("coerces page / pageSize from string (URL searchParams)", () => {
    const parsed = commentFilterSchema.parse({ page: "3", pageSize: "50" })
    expect(parsed.page).toBe(3)
    expect(parsed.pageSize).toBe(50)
  })

  it("rejects pageSize > 100", () => {
    expect(() =>
      commentFilterSchema.parse({ pageSize: 101 }),
    ).toThrow()
  })
})

describe("commentStatusUpdateSchema", () => {
  it("accepts valid status enum", () => {
    expect(() =>
      commentStatusUpdateSchema.parse({ status: "APPROVED" }),
    ).not.toThrow()
  })

  it("rejects missing status", () => {
    expect(() => commentStatusUpdateSchema.parse({})).toThrow()
  })

  it("rejects invalid status", () => {
    expect(() =>
      commentStatusUpdateSchema.parse({ status: "RANDOM" }),
    ).toThrow()
  })
})

describe("commentBulkUpdateSchema", () => {
  it("accepts ids + status", () => {
    expect(() =>
      commentBulkUpdateSchema.parse({
        ids: ["a", "b", "c"],
        status: "APPROVED",
      }),
    ).not.toThrow()
  })

  it("rejects empty ids array", () => {
    expect(() =>
      commentBulkUpdateSchema.parse({ ids: [], status: "APPROVED" }),
    ).toThrow()
  })

  it("rejects ids containing empty strings", () => {
    expect(() =>
      commentBulkUpdateSchema.parse({ ids: ["a", ""], status: "APPROVED" }),
    ).toThrow()
  })
})
