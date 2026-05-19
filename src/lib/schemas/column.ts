import { z } from "zod"

import { SUPPORTED_LOCALES } from "@/lib/i18n"

/**
 * Column schemas — single source of truth for both API validation and
 * react-hook-form resolvers (per systemPatterns §6).
 *
 * `translations` is an array of locale-scoped name/description rows that
 * mirror the ColumnTranslation child table. On `create` at least one row is
 * required; on `update` any row provided replaces (upsert) the matching
 * (columnId, locale) translation.
 */

// SUPPORTED_LOCALES is a readonly tuple `["zh", "en"] as const`. Zod 4 accepts
// readonly tuples directly, but we widen to the structural literal tuple shape
// `z.enum` expects so this stays robust against future locale additions.
const localeEnum = z.enum(
  SUPPORTED_LOCALES as unknown as [string, ...string[]],
)

export const columnTranslationInputSchema = z.object({
  locale: localeEnum,
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
})
export type ColumnTranslationInput = z.infer<
  typeof columnTranslationInputSchema
>

// Cover accepts: empty string (clear), absolute http(s) URL, or "/"-rooted
// path so the future CoverUploader can write local-driver `/uploads/...`.
const coverFieldSchema = z
  .string()
  .refine(
    (v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"),
    "封面必须是 URL 或以 / 开头的路径",
  )
  .optional()
  .nullable()

export const createColumnSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug 只能含小写字母、数字、连字符"),
  cover: coverFieldSchema,
  order: z.number().int().min(0).optional(),
  translations: z.array(columnTranslationInputSchema).min(1),
})
export type CreateColumnInput = z.infer<typeof createColumnSchema>

// All fields optional for partial updates. When `translations` is provided,
// each entry is upserted by (columnId, locale); rows for locales not included
// are left untouched.
export const updateColumnSchema = createColumnSchema.partial()
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>

export const reorderColumnsSchema = z.object({
  // Order is implicit: the column at index `i` receives `order = i`.
  ids: z.array(z.string().min(1)).min(1),
})
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>
