import type {
  Channel,
  ChannelTranslation,
  EntryStatus,
  EntryTranslation,
  Prisma,
  Tag,
} from "@prisma/client"

import { db } from "@/lib/db"
import { errors } from "@/lib/errors"
import type { Locale } from "@/lib/i18n"
import { DEFAULT_LOCALE } from "@/lib/i18n"
import type {
  CreatePostInput,
  PostFilterInput,
  UpdatePostInput,
} from "@/lib/schemas/post"
import { upsertTagsBySlug } from "@/lib/services/tags"

export type PostWithRelations = {
  id: string
  slug: string
  cover: string | null
  status: EntryStatus
  publishedAt: Date | null
  authorId: string
  columnId: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: Date
  updatedAt: Date
  translations: Array<{
    id: string
    locale: string
    title: string
    excerpt: string | null
    content: string
    postId?: string
    entryId?: string
  }>
  column: (Channel & { translations: ChannelTranslation[] }) | null
  tags: Array<{ tag: Tag }>
  author: { id: string; email: string; name: string | null }
}

export type PostListItem = {
  id: string
  slug: string
  cover: string | null
  status: EntryStatus
  publishedAt: Date | null
  columnId: string | null
  columnName: string | null
  authorName: string | null
  title: string
  excerpt: string | null
  tags: Array<{ slug: string; name: string }>
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: Date
  updatedAt: Date
}

const includeRelations = {
  translations: true,
  channel: { include: { translations: true } },
  tags: { include: { tag: true } },
  author: { select: { id: true, email: true, name: true } },
} satisfies Prisma.EntryInclude

type EntryWithRelations = Prisma.EntryGetPayload<{
  include: typeof includeRelations
}>

export async function listPosts(
  filter: PostFilterInput,
  locale: Locale,
): Promise<{
  items: PostListItem[]
  total: number
  page: number
  pageSize: number
}> {
  const where: Prisma.EntryWhereInput = { kind: "ARTICLE" }

  if (filter.status) where.status = filter.status
  if (filter.columnId) where.channelId = filter.columnId
  if (filter.tag) {
    where.tags = { some: { tag: { slug: filter.tag } } }
  }
  if (filter.q && filter.q.trim()) {
    where.translations = {
      some: {
        locale,
        title: { contains: filter.q.trim(), mode: "insensitive" },
      },
    }
  }

  const orderBy: Prisma.EntryOrderByWithRelationInput[] =
    filter.status === "PUBLISHED"
      ? [{ publishedAt: { sort: "desc", nulls: "last" } }]
      : [{ updatedAt: "desc" }]

  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const [rows, total] = await Promise.all([
    db.entry.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: includeRelations,
    }),
    db.entry.count({ where }),
  ])

  const items: PostListItem[] = rows.map((entry) => {
    const tr = pickTranslation(entry.translations, locale)
    const metadata = readArticleMetadata(entry.metadata)
    const channelTr = pickChannelTranslation(entry.channel.translations, locale)

    return {
      id: entry.id,
      slug: entry.slug,
      cover: metadata.cover,
      status: entry.status,
      publishedAt: entry.publishedAt,
      columnId: entry.channelId,
      columnName: channelTr?.name ?? null,
      authorName: entry.author.name,
      title: tr?.title ?? "(untitled)",
      excerpt: tr?.excerpt ?? null,
      tags: entry.tags.map((t) => ({ slug: t.tag.slug, name: t.tag.name })),
      viewCount: entry.viewCount,
      likeCount: entry.likeCount,
      commentCount: entry.commentCount,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }
  })

  return { items, total, page, pageSize }
}

export async function getPostById(
  id: string,
): Promise<PostWithRelations | null> {
  const row = await db.entry.findUnique({
    where: { id },
    include: includeRelations,
  })
  return row ? toPostCompat(row) : null
}

export async function getPostBySlug(
  slug: string,
): Promise<PostWithRelations | null> {
  const row = await db.entry.findFirst({
    where: { slug, kind: "ARTICLE" },
    include: includeRelations,
  })
  return row ? toPostCompat(row) : null
}

export async function listAllPublishedSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  const pageSize = 100
  const rows: Array<{ slug: string; updatedAt: Date }> = []

  for (let page = 0; ; page++) {
    const batch = await db.entry.findMany({
      where: { kind: "ARTICLE", status: "PUBLISHED" },
      orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }],
      skip: page * pageSize,
      take: pageSize,
      select: { slug: true, updatedAt: true },
    })

    rows.push(...batch)
    if (batch.length < pageSize) break
  }

  return rows
}

export async function createPost(
  input: CreatePostInput,
  authorId: string,
): Promise<PostWithRelations> {
  assertUniqueLocales(input.translations)

  const existing = await db.entry.findUnique({ where: { slug: input.slug } })
  if (existing) {
    throw errors.conflict(`Entry with slug "${input.slug}" already exists`)
  }

  const channelId =
    input.columnId ?? (await ensureDefaultArticleChannel()).id
  const tagRows =
    input.tags.length > 0
      ? await upsertTagsBySlug(input.tags.map((slug) => ({ slug })))
      : []
  const publishedAt = resolvePublishedAt(
    input.status,
    input.publishedAt ?? null,
    null,
  )

  const created = await db.entry.create({
    data: {
      slug: input.slug,
      kind: "ARTICLE",
      status: input.status,
      publishedAt,
      authorId,
      channelId,
      body: input.translations[0]?.content ?? "",
      metadata: { cover: input.cover ?? null, toc: true },
      translations: {
        create: input.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          excerpt: t.excerpt ?? null,
        })),
      },
      tags:
        tagRows.length > 0
          ? { create: tagRows.map((tag) => ({ tagId: tag.id })) }
          : undefined,
    },
    include: includeRelations,
  })

  return toPostCompat(created)
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
): Promise<PostWithRelations> {
  const current = await db.entry.findUnique({ where: { id } })
  if (!current) {
    throw errors.notFound(`Entry ${id} not found`)
  }

  if (input.slug && input.slug !== current.slug) {
    const clash = await db.entry.findUnique({ where: { slug: input.slug } })
    if (clash) {
      throw errors.conflict(`Entry with slug "${input.slug}" already exists`)
    }
  }

  if (input.translations) {
    assertUniqueLocales(input.translations)
  }

  const tagRows =
    input.tags !== undefined
      ? input.tags.length > 0
        ? await upsertTagsBySlug(input.tags.map((slug) => ({ slug })))
        : []
      : null

  const data: Prisma.EntryUpdateInput = {}
  if (input.slug !== undefined) data.slug = input.slug
  if (input.status !== undefined) data.status = input.status
  if (input.columnId !== undefined) {
    data.channel = input.columnId
      ? { connect: { id: input.columnId } }
      : { connect: { id: (await ensureDefaultArticleChannel()).id } }
  }
  if (input.cover !== undefined) {
    data.metadata = {
      ...readArticleMetadata(current.metadata),
      cover: input.cover ?? null,
    }
  }
  if (input.translations?.[0]?.content !== undefined) {
    data.body = input.translations[0].content
  }
  if (input.publishedAt !== undefined || input.status !== undefined) {
    const nextStatus = input.status ?? current.status
    data.publishedAt = resolvePublishedAt(
      nextStatus,
      input.publishedAt === undefined
        ? current.publishedAt
        : input.publishedAt ?? null,
      current.publishedAt,
    )
  }

  return db.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.entry.update({ where: { id }, data })
    }

    if (input.translations) {
      for (const t of input.translations) {
        await tx.entryTranslation.upsert({
          where: { entryId_locale: { entryId: id, locale: t.locale } },
          create: {
            entryId: id,
            locale: t.locale,
            title: t.title,
            excerpt: t.excerpt ?? null,
          },
          update: {
            title: t.title,
            excerpt: t.excerpt ?? null,
          },
        })
      }
    }

    if (tagRows !== null) {
      await tx.tagsOnEntries.deleteMany({ where: { entryId: id } })
      if (tagRows.length > 0) {
        await tx.tagsOnEntries.createMany({
          data: tagRows.map((tag) => ({ entryId: id, tagId: tag.id })),
          skipDuplicates: true,
        })
      }
    }

    const updated = await tx.entry.findUnique({
      where: { id },
      include: includeRelations,
    })
    if (!updated) {
      throw errors.notFound(`Entry ${id} not found`)
    }
    return toPostCompat(updated)
  })
}

export async function deletePost(id: string): Promise<void> {
  const current = await db.entry.findUnique({ where: { id } })
  if (!current) {
    throw errors.notFound(`Entry ${id} not found`)
  }
  await db.entry.delete({ where: { id } })
}

export async function incrementPostView(
  slug: string,
  visitorHash: string,
  dayKey: string,
): Promise<{ counted: boolean; viewCount: number }> {
  const entry = await db.entry.findFirst({
    where: { slug, kind: "ARTICLE" },
    select: { id: true, viewCount: true },
  })
  if (!entry) {
    throw errors.notFound(`Entry with slug "${slug}" not found`)
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.entryView.create({
        data: { entryId: entry.id, visitorHash, dayKey },
      })
      const updated = await tx.entry.update({
        where: { id: entry.id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      })
      return updated.viewCount
    })
    return { counted: true, viewCount: result }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { counted: false, viewCount: entry.viewCount }
    }
    throw error
  }
}

function toPostCompat(entry: EntryWithRelations): PostWithRelations {
  const metadata = readArticleMetadata(entry.metadata)
  return {
    ...entry,
    cover: metadata.cover,
    columnId: entry.channelId,
    column: entry.channel,
    translations: entry.translations.map((translation) => ({
      ...translation,
      content: entry.body,
    })),
  }
}

function pickTranslation(
  rows: EntryTranslation[],
  locale: Locale,
): EntryTranslation | null {
  const exact = rows.find((row) => row.locale === locale)
  if (exact) return exact
  if (locale !== DEFAULT_LOCALE) {
    const fallback = rows.find((row) => row.locale === DEFAULT_LOCALE)
    if (fallback) return fallback
  }
  return rows[0] ?? null
}

function pickChannelTranslation(
  rows: ChannelTranslation[],
  locale: Locale,
): ChannelTranslation | null {
  const exact = rows.find((row) => row.locale === locale)
  if (exact) return exact
  if (locale !== DEFAULT_LOCALE) {
    const fallback = rows.find((row) => row.locale === DEFAULT_LOCALE)
    if (fallback) return fallback
  }
  return rows[0] ?? null
}

function assertUniqueLocales(
  translations: ReadonlyArray<{ locale: string }>,
): void {
  const seen = new Set<string>()
  for (const translation of translations) {
    if (seen.has(translation.locale)) {
      throw errors.validation(
        `Duplicate translation locale "${translation.locale}" in payload`,
      )
    }
    seen.add(translation.locale)
  }
}

function resolvePublishedAt(
  status: EntryStatus,
  incoming: Date | string | null,
  current: Date | null,
): Date | null {
  const normalized =
    incoming === null || incoming === undefined
      ? null
      : incoming instanceof Date
        ? incoming
        : new Date(incoming)

  if (status === "PUBLISHED") {
    return normalized ?? current ?? new Date()
  }
  return normalized ?? current
}

function readArticleMetadata(raw: Prisma.JsonValue): {
  cover: string | null
  toc?: boolean
  readingMinutes?: number
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { cover: null }
  }
  const value = raw as Record<string, unknown>
  return {
    cover: typeof value.cover === "string" ? value.cover : null,
    toc: typeof value.toc === "boolean" ? value.toc : undefined,
    readingMinutes:
      typeof value.readingMinutes === "number"
        ? value.readingMinutes
        : undefined,
  }
}

async function ensureDefaultArticleChannel(): Promise<Pick<Channel, "id">> {
  const existing = await db.channel.findUnique({
    where: { slug: "articles" },
    select: { id: true },
  })
  if (existing) return existing

  return db.channel.upsert({
    where: { slug: "articles" },
    update: {},
    create: {
      slug: "articles",
      order: 0,
      enabled: true,
      kind: "ARTICLES",
      layout: "CHRONICLE",
      translations: {
        create: {
          locale: DEFAULT_LOCALE,
          name: "文章",
          description: "长文与思考",
        },
      },
    },
    select: { id: true },
  })
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  )
}
