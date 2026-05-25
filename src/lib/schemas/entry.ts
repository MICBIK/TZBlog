import { z } from "zod";

import { SUPPORTED_LOCALES } from "@/lib/i18n";

const localeEnum = z.enum(SUPPORTED_LOCALES as unknown as [string, ...string[]]);
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const entryKindEnum = z.enum([
  "ARTICLE",
  "NOTE",
  "LINK",
  "JOKE",
  "HOT_TAKE",
  "REVIEW",
  "QUOTE",
  "GUESTBOOK_THREAD",
]);

export const entryStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const entryTranslationInputSchema = z.object({
  locale: localeEnum,
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string(),
});

export const createEntrySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(slugRegex, "slug 只能含小写字母、数字、连字符"),
  channelId: z.string().min(1),
  kind: entryKindEnum,
  status: entryStatusEnum.default("DRAFT"),
  publishedAt: z.union([z.string().datetime(), z.date()]).optional().nullable(),
  seriesId: z.string().optional().nullable(),
  seriesOrder: z.coerce.number().int().positive().optional().nullable(),
  tags: z.array(z.string().min(1).max(60)).default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  translations: z.array(entryTranslationInputSchema).min(1),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

export const updateEntrySchema = createEntrySchema.partial();

export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;


export const articleFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: entryStatusEnum.optional(),
  channelId: z.string().optional(),
  tag: z.string().optional(),
  q: z.string().optional(),
});
export type ArticleFilterInput = z.infer<typeof articleFilterSchema>;
