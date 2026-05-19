import { z } from "zod"

import { SUPPORTED_LOCALES } from "@/lib/i18n"

/**
 * Post schemas — single source of truth for both API validation and
 * react-hook-form resolvers (per systemPatterns §6).
 *
 * `content` is always Markdown (the wire format between editor and server,
 * per systemPatterns §14). On `update`, any translation provided is upserted
 * by `(postId, locale)`; locales not in the array are left untouched.
 *
 * `tags` is a list of tag *slugs*. The post service upserts `Tag` rows by
 * slug before linking, so the API never needs raw tag ids.
 */

// SUPPORTED_LOCALES is a `["zh", "en"] as const` tuple. Zod accepts readonly
// tuples, but we widen it to the structural literal-tuple shape so adding a
// new locale to i18n.ts keeps this happy without a schema rewrite.
const localeEnum = z.enum(
  SUPPORTED_LOCALES as unknown as [string, ...string[]],
)

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Cover accepts: empty string (clear), absolute http(s) URL, or "/"-rooted
// path (CoverUploader writes `/uploads/...` for local-driver storage).
const coverFieldSchema = z
  .string()
  .refine(
    (v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"),
    "封面必须是 URL 或以 / 开头的路径",
  )
  .optional()
  .nullable()

export const postStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"])
export type PostStatus = z.infer<typeof postStatusEnum>

export const postTranslationInputSchema = z.object({
  locale: localeEnum,
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  // Empty string is allowed so drafts can save with no body yet.
  content: z.string(),
})
export type PostTranslationInput = z.infer<typeof postTranslationInputSchema>

export const createPostSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(slugRegex, "slug 只能含小写字母、数字、连字符"),
  cover: coverFieldSchema,
  status: postStatusEnum.default("DRAFT"),
  publishedAt: z
    .union([z.string().datetime(), z.date()])
    .optional()
    .nullable(),
  columnId: z.string().optional().nullable(),
  // Tag *slugs*; the service upserts Tag rows by slug before linking.
  tags: z.array(z.string().min(1).max(60)).default([]),
  translations: z.array(postTranslationInputSchema).min(1),
})
export type CreatePostInput = z.infer<typeof createPostSchema>

// All fields optional for partial updates. When `translations` is provided,
// each entry is upserted by `(postId, locale)`. When `tags` is provided, the
// full set of tag links is *replaced* (existing links removed, new ones added).
export const updatePostSchema = createPostSchema.partial()
export type UpdatePostInput = z.infer<typeof updatePostSchema>

export const postFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: postStatusEnum.optional(),
  columnId: z.string().optional(),
  tag: z.string().optional(), // tag slug
  q: z.string().optional(), // searches PostTranslation.title (current locale)
})
export type PostFilterInput = z.infer<typeof postFilterSchema>
