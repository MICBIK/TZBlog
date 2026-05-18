import { describe, it, expect } from "vitest"
import {
  createPostSchema,
  updatePostSchema,
  postFilterSchema,
  postStatusEnum,
} from "./post"

/**
 * Schema-only tests — no DB. These should be GREEN as soon as agent A's
 * post schema lands. Note: agent A's schema currently exports
 * `postStatusEnum` and uses `tagSlug` as the filter key, while the
 * contract handed to this agent describes `postStatusEnum` / `tag`. We
 * test against the names actually present in the schema module
 * (postStatusEnum, tagSlug); the rule coverage is the same.
 */

const validInput = () => ({
  slug: "hello-world",
  translations: [
    { locale: "zh", title: "你好世界", content: "正文" },
  ],
})

describe("postStatusEnum", () => {
  it("accepts the three valid values", () => {
    expect(postStatusEnum.safeParse("DRAFT").success).toBe(true)
    expect(postStatusEnum.safeParse("PUBLISHED").success).toBe(true)
    expect(postStatusEnum.safeParse("ARCHIVED").success).toBe(true)
  })

  it("rejects an unknown status", () => {
    expect(postStatusEnum.safeParse("WRONG").success).toBe(false)
  })
})

describe("createPostSchema", () => {
  it("accepts a fully-formed input and defaults status to DRAFT", () => {
    const r = createPostSchema.safeParse(validInput())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.status).toBe("DRAFT")
    }
  })

  it("accepts kebab-case slug with digits", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      slug: "v2-roadmap-2026",
    })
    expect(r.success).toBe(true)
  })

  it("rejects slug containing uppercase letters", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      slug: "HelloWorld",
    })
    expect(r.success).toBe(false)
  })

  it("rejects an empty translations array", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      translations: [],
    })
    expect(r.success).toBe(false)
  })

  it("rejects a translation whose title is empty", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      translations: [{ locale: "zh", title: "", content: "x" }],
    })
    expect(r.success).toBe(false)
  })

  it("rejects a translation whose title exceeds 200 chars", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      translations: [
        { locale: "zh", title: "a".repeat(201), content: "x" },
      ],
    })
    expect(r.success).toBe(false)
  })

  it("rejects cover when it is not a URL", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      cover: "not-a-url",
    })
    expect(r.success).toBe(false)
  })

  it("accepts cover when omitted", () => {
    const r = createPostSchema.safeParse(validInput())
    expect(r.success).toBe(true)
  })

  it("accepts cover when explicitly null", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      cover: null,
    })
    // Either the schema treats null as nullable (preferred) or coerces it
    // away — both are acceptable so long as it doesn't reject.
    expect(r.success).toBe(true)
  })

  it("rejects status not in the enum", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      status: "WRONG",
    })
    expect(r.success).toBe(false)
  })

  it("rejects a tags array that contains an empty string", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      tags: ["typescript", ""],
    })
    expect(r.success).toBe(false)
  })

  it("accepts publishedAt as an ISO string", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      publishedAt: "2026-01-01T00:00:00Z",
    })
    expect(r.success).toBe(true)
    if (r.success && r.data.publishedAt) {
      // schema accepts string or Date — just verify it's truthy
      expect(r.data.publishedAt).toBeTruthy()
    }
  })

  it("accepts publishedAt as a Date object", () => {
    const r = createPostSchema.safeParse({
      ...validInput(),
      publishedAt: new Date("2026-01-01T00:00:00Z"),
    })
    expect(r.success).toBe(true)
  })
})

describe("updatePostSchema", () => {
  it("accepts a fully empty object (everything optional)", () => {
    const r = updatePostSchema.safeParse({})
    expect(r.success).toBe(true)
  })

  it("rejects an invalid slug when slug is provided", () => {
    const r = updatePostSchema.safeParse({ slug: "Bad Slug" })
    expect(r.success).toBe(false)
  })

  it("accepts a partial translation replacement", () => {
    const r = updatePostSchema.safeParse({
      translations: [{ locale: "en", title: "Hi", content: "body" }],
    })
    expect(r.success).toBe(true)
  })
})

describe("postFilterSchema", () => {
  it("defaults page=1, pageSize=20 when nothing provided", () => {
    const r = postFilterSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.page).toBe(1)
      expect(r.data.pageSize).toBe(20)
    }
  })

  it("rejects page=0", () => {
    const r = postFilterSchema.safeParse({ page: 0 })
    expect(r.success).toBe(false)
  })

  it("rejects pageSize=200", () => {
    const r = postFilterSchema.safeParse({ pageSize: 200 })
    expect(r.success).toBe(false)
  })

  it("rejects status='WRONG'", () => {
    const r = postFilterSchema.safeParse({ status: "WRONG" })
    expect(r.success).toBe(false)
  })

  it("accepts status='PUBLISHED'", () => {
    const r = postFilterSchema.safeParse({ status: "PUBLISHED" })
    expect(r.success).toBe(true)
  })
})
