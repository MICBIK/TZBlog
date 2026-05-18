import { z } from "zod";

/**
 * Post schemas — single source of truth for both API validation
 * and react-hook-form resolvers (per systemPatterns §6).
 *
 * `content` is always Markdown (the wire format between editor and server,
 * per systemPatterns §14).
 */

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const postStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

export const postTranslationInputSchema = z.object({
  locale: z.string().min(2).max(10),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string(),
});
export type PostTranslationInput = z.infer<typeof postTranslationInputSchema>;

export const createPostSchema = z.object({
  slug: z.string().min(1).max(120).regex(slugRegex, {
    message: "slug must be kebab-case (a-z, 0-9, -)",
  }),
  columnId: z.string().uuid().optional(),
  cover: z.string().url().optional(),
  status: postStatusSchema.default("DRAFT"),
  publishedAt: z.coerce.date().optional(),
  translations: z.array(postTranslationInputSchema).min(1),
  tags: z.array(z.string().min(1).max(60)).default([]),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

// All fields optional for partial updates; translations array, when present,
// fully replaces the current set so callers must include every locale they
// want to keep.
export const updatePostSchema = createPostSchema.partial();
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const postFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  columnId: z.string().uuid().optional(),
  tagSlug: z.string().min(1).optional(),
  status: postStatusSchema.optional(),
});
export type PostFilter = z.infer<typeof postFilterSchema>;
