import { describe, it, expect } from "vitest"
import {
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
} from "./column"

/**
 * Schema-only tests — no DB. These should be GREEN as soon as agent A's
 * schemas are landed.
 */

const validInput = () => ({
  slug: "tech-notes",
  translations: [{ locale: "zh", name: "技术笔记", description: "随手记" }],
})

describe("createColumnSchema", () => {
  it("accepts a fully-formed input", () => {
    const r = createColumnSchema.safeParse(validInput())
    expect(r.success).toBe(true)
  })

  it("accepts kebab-case slug with digits", () => {
    const r = createColumnSchema.safeParse({
      ...validInput(),
      slug: "v2-roadmap-2026",
    })
    expect(r.success).toBe(true)
  })

  it("rejects slug containing uppercase letters", () => {
    const r = createColumnSchema.safeParse({
      ...validInput(),
      slug: "TechNotes",
    })
    expect(r.success).toBe(false)
  })

  it("rejects slug containing chinese characters", () => {
    const r = createColumnSchema.safeParse({
      ...validInput(),
      slug: "技术-notes",
    })
    expect(r.success).toBe(false)
  })

  it("rejects slug containing spaces", () => {
    const r = createColumnSchema.safeParse({
      ...validInput(),
      slug: "tech notes",
    })
    expect(r.success).toBe(false)
  })

  it("rejects an empty translations array", () => {
    const r = createColumnSchema.safeParse({
      ...validInput(),
      translations: [],
    })
    expect(r.success).toBe(false)
  })

  it("rejects a translation whose name is empty", () => {
    const r = createColumnSchema.safeParse({
      ...validInput(),
      translations: [{ locale: "zh", name: "" }],
    })
    expect(r.success).toBe(false)
  })

  it("rejects cover when it is not a URL", () => {
    const r = createColumnSchema.safeParse({
      ...validInput(),
      cover: "not-a-url",
    })
    expect(r.success).toBe(false)
  })

  it("accepts cover when omitted", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cover: _cover, ...rest } = { ...validInput(), cover: undefined }
    const r = createColumnSchema.safeParse(rest)
    expect(r.success).toBe(true)
  })

  it("accepts cover when explicitly null", () => {
    const r = createColumnSchema.safeParse({
      ...validInput(),
      cover: null,
    })
    // Either schema treats null as nullable (preferred) or strips it; both
    // are acceptable so long as it doesn't reject.
    expect(r.success).toBe(true)
  })
})

describe("updateColumnSchema", () => {
  it("accepts an empty object (everything optional)", () => {
    const r = updateColumnSchema.safeParse({})
    expect(r.success).toBe(true)
  })

  it("rejects an invalid slug when slug is provided", () => {
    const r = updateColumnSchema.safeParse({ slug: "Bad Slug" })
    expect(r.success).toBe(false)
  })

  it("accepts a partial translations replacement", () => {
    const r = updateColumnSchema.safeParse({
      translations: [{ locale: "en", name: "Tech Notes" }],
    })
    expect(r.success).toBe(true)
  })
})

describe("reorderColumnsSchema", () => {
  it("accepts an array of cuid-ish strings", () => {
    const r = reorderColumnsSchema.safeParse({
      ids: ["ckxx0000000000000001", "ckxx0000000000000002"],
    })
    expect(r.success).toBe(true)
  })

  it("rejects an empty array", () => {
    const r = reorderColumnsSchema.safeParse([])
    expect(r.success).toBe(false)
  })

  it("rejects non-string elements", () => {
    const r = reorderColumnsSchema.safeParse([1, 2, 3])
    expect(r.success).toBe(false)
  })

  it("rejects empty-string elements", () => {
    const r = reorderColumnsSchema.safeParse(["abc", ""])
    expect(r.success).toBe(false)
  })
})
