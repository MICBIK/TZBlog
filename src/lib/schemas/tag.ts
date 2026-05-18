import { z } from "zod"

/**
 * Tag schemas — shared between API validation and react-hook-form resolvers
 * (per systemPatterns §6).
 *
 * `Tag` has no per-locale child table for MVP: the slug stays canonical and
 * the display name is just a single string. If we add localized tag names
 * later, a `TagTranslation` table is the path forward.
 */

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createTagSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(slugRegex, "slug 只能含小写字母、数字、连字符"),
  name: z.string().min(1).max(60),
})
export type CreateTagInput = z.infer<typeof createTagSchema>

export const tagFilterSchema = z.object({
  q: z.string().optional(),
})
export type TagFilterInput = z.infer<typeof tagFilterSchema>
