import { z } from "zod"

const pathOrUrlSchema = z
  .string()
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//.test(value),
    "URL must be absolute http(s) or a site-rooted path",
  )

export const articleMetadataSchema = z.object({
  cover: pathOrUrlSchema.optional().nullable(),
  readingMinutes: z.number().int().positive().optional(),
  toc: z.boolean().default(true),
  ogImage: pathOrUrlSchema.optional().nullable(),
})

export const noteMetadataSchema = z.object({
  pinned: z.boolean().default(false),
  mood: z
    .enum(["curious", "focused", "frustrated", "celebratory"])
    .optional(),
})

export const linkMetadataSchema = z.object({
  sourceUrl: z.string().url(),
  sourceTitle: z.string().min(1),
  sourceAuthor: z.string().optional(),
  thumbnail: pathOrUrlSchema.optional().nullable(),
  domain: z.string().optional(),
})

export const jokeMetadataSchema = z.object({
  category: z.enum(["tech", "life", "absurd"]).default("absurd"),
  punchlineHidden: z.boolean().default(false),
})

export const hotTakeMetadataSchema = z.object({
  sourcePlatform: z.enum([
    "weibo",
    "twitter",
    "aihot",
    "hackernews",
    "v2ex",
    "zhihu",
  ]),
  sourceUrl: z.string().url(),
  sourceSnippet: z.string().min(1),
  capturedAt: z.string().datetime().optional(),
  aiCommentary: z.string().optional(),
})

export const reviewMetadataSchema = z.object({
  itemType: z.enum(["book", "movie", "tool", "paper", "product"]),
  itemTitle: z.string().min(1),
  itemAuthor: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  externalUrl: z.string().url().optional(),
  cover: pathOrUrlSchema.optional().nullable(),
})

export const quoteMetadataSchema = z.object({
  author: z.string().min(1),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  language: z.string().optional(),
})

export const guestbookThreadMetadataSchema = z.object({
  visibility: z.enum(["PRIVATE_TO_AUTHOR", "PUBLIC"]).default("PRIVATE_TO_AUTHOR"),
  visitorName: z.string().min(1).max(40),
  visitorEmail: z.string().email().optional(),
  resolved: z.boolean().default(false),
})

export const entryMetadataSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ARTICLE"), data: articleMetadataSchema }),
  z.object({ kind: z.literal("NOTE"), data: noteMetadataSchema }),
  z.object({ kind: z.literal("LINK"), data: linkMetadataSchema }),
  z.object({ kind: z.literal("JOKE"), data: jokeMetadataSchema }),
  z.object({ kind: z.literal("HOT_TAKE"), data: hotTakeMetadataSchema }),
  z.object({ kind: z.literal("REVIEW"), data: reviewMetadataSchema }),
  z.object({ kind: z.literal("QUOTE"), data: quoteMetadataSchema }),
  z.object({
    kind: z.literal("GUESTBOOK_THREAD"),
    data: guestbookThreadMetadataSchema,
  }),
])

export type EntryMetadata = z.infer<typeof entryMetadataSchema>
export type EntryKindForMetadata = EntryMetadata["kind"]

export function parseEntryMetadata(
  kind: EntryKindForMetadata,
  raw: unknown,
): EntryMetadata {
  return entryMetadataSchema.parse({ kind, data: raw })
}
