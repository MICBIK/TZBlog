import type {
  Column,
  ColumnTranslation,
  Post,
  PostStatus,
  PostTranslation,
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

/**
 * Post service — owns the multi-table workflows for the Post +
 * PostTranslation + Tag + PostView pipeline (per systemPatterns §3 §7 §9 §10).
 *
 * Authoring stays here so route handlers don't reach into Prisma directly:
 * slug uniqueness, translation upserts, tag re-linking, publish-time
 * defaulting, and PostView de-duplication are all coordinated in one place.
 */

export type PostWithRelations = Post & {
  translations: PostTranslation[]
  column: (Column & { translations: ColumnTranslation[] }) | null
  tags: Array<{ tag: Tag }>
  author: { id: string; email: string; name: string | null }
}

export type PostListItem = {
  id: string
  slug: string
  cover: string | null
  status: PostStatus
  publishedAt: Date | null
  columnId: string | null
  columnName: string | null // resolved for the requested locale
  authorName: string | null
  title: string // resolved for the requested locale
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
  column: { include: { translations: true } },
  tags: { include: { tag: true } },
  author: { select: { id: true, email: true, name: true } },
} satisfies Prisma.PostInclude

// ---------- queries ----------

/**
 * Paginated admin list. The list view collapses translations down to one
 * row per locale; rows missing the requested locale fall back to the
 * project's `DEFAULT_LOCALE` so drafts authored in zh remain visible when
 * the admin viewer is set to en.
 *
 * Sort:
 *   - When `filter.status === "PUBLISHED"`, by `publishedAt desc` (nulls last).
 *   - Otherwise by `updatedAt desc` so freshly-edited drafts surface first.
 */
export async function listPosts(
  filter: PostFilterInput,
  locale: Locale,
): Promise<{
  items: PostListItem[]
  total: number
  page: number
  pageSize: number
}> {
  const where: Prisma.PostWhereInput = {}

  if (filter.status) where.status = filter.status
  if (filter.columnId) where.columnId = filter.columnId
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

  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    filter.status === "PUBLISHED"
      ? [{ publishedAt: { sort: "desc", nulls: "last" } }]
      : [{ updatedAt: "desc" }]

  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const [rows, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: includeRelations,
    }),
    db.post.count({ where }),
  ])

  // Resolve the column's localized name lazily — listPosts is the one place
  // we don't pull ColumnTranslation in the include, so we do a single batched
  // lookup keyed by the columnIds we actually saw.
  const columnIds = Array.from(
    new Set(
      rows
        .map((r) => r.columnId)
        .filter((id): id is string => typeof id === "string"),
    ),
  )

  const columnNameById = new Map<string, string>()
  if (columnIds.length > 0) {
    const tr = await db.columnTranslation.findMany({
      where: { columnId: { in: columnIds }, locale },
      select: { columnId: true, name: true },
    })
    for (const row of tr) columnNameById.set(row.columnId, row.name)

    // Fill blanks with the default locale so admin rows don't show "—" just
    // because someone hasn't translated a column yet.
    if (locale !== DEFAULT_LOCALE) {
      const missing = columnIds.filter((id) => !columnNameById.has(id))
      if (missing.length > 0) {
        const fallback = await db.columnTranslation.findMany({
          where: { columnId: { in: missing }, locale: DEFAULT_LOCALE },
          select: { columnId: true, name: true },
        })
        for (const row of fallback) columnNameById.set(row.columnId, row.name)
      }
    }
  }

  const items: PostListItem[] = rows.map((p) => {
    const tr = pickTranslation(p.translations, locale)
    return {
      id: p.id,
      slug: p.slug,
      cover: p.cover,
      status: p.status,
      publishedAt: p.publishedAt,
      columnId: p.columnId,
      columnName: p.columnId ? columnNameById.get(p.columnId) ?? null : null,
      authorName: p.author.name,
      title: tr?.title ?? "(untitled)",
      excerpt: tr?.excerpt ?? null,
      tags: p.tags.map((t) => ({ slug: t.tag.slug, name: t.tag.name })),
      viewCount: p.viewCount,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }
  })

  return { items, total, page, pageSize }
}

export async function getPostById(
  id: string,
): Promise<PostWithRelations | null> {
  return db.post.findUnique({ where: { id }, include: includeRelations })
}

export async function getPostBySlug(
  slug: string,
): Promise<PostWithRelations | null> {
  return db.post.findUnique({ where: { slug }, include: includeRelations })
}

export async function listAllPublishedSlugs(
  locale: Locale,
): Promise<Array<{ slug: string; updatedAt: Date }>> {
  void locale

  const pageSize = 100
  const rows: Array<{ slug: string; updatedAt: Date }> = []

  for (let page = 0; ; page++) {
    const batch = await db.post.findMany({
      where: { status: "PUBLISHED" },
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

// ---------- mutations ----------

/**
 * Create a post + its translations + tag links inside a single transaction.
 *
 * Flow:
 *   1. Reject duplicate slug up front.
 *   2. Default `publishedAt` to `now()` when status is PUBLISHED but the
 *      caller didn't supply a date (matches the admin UX of "publish now").
 *   3. Upsert any `tags` (by slug) so the join table can connect by id.
 *   4. Inside the transaction: create the Post with nested translations and
 *      the TagsOnPosts links.
 */
export async function createPost(
  input: CreatePostInput,
  authorId: string,
): Promise<PostWithRelations> {
  assertUniqueLocales(input.translations)

  const existing = await db.post.findUnique({ where: { slug: input.slug } })
  if (existing) {
    throw errors.conflict(`Post with slug "${input.slug}" already exists`)
  }

  const tagRows =
    input.tags.length > 0
      ? await upsertTagsBySlug(input.tags.map((slug) => ({ slug })))
      : []

  const publishedAt = resolvePublishedAt(
    input.status,
    input.publishedAt ?? null,
    null,
  )

  const created = await db.post.create({
    data: {
      slug: input.slug,
      cover: input.cover ?? null,
      status: input.status,
      publishedAt,
      authorId,
      columnId: input.columnId ?? null,
      translations: {
        create: input.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          excerpt: t.excerpt ?? null,
          content: t.content,
        })),
      },
      tags:
        tagRows.length > 0
          ? {
              create: tagRows.map((t) => ({ tagId: t.id })),
            }
          : undefined,
    },
    include: includeRelations,
  })

  return created
}

/**
 * Patch a post.
 *
 * - Fields in `input` other than `translations` / `tags` are written via
 *   `post.update`.
 * - When `translations` is provided, each entry is upserted by
 *   `(postId, locale)`. Locales not in the array are left untouched (parity
 *   with `updateColumn`).
 * - When `tags` is provided, the *full* set of tag links is replaced —
 *   missing slugs are removed, new slugs are upserted then linked.
 * - When status flips to PUBLISHED and `publishedAt` is still null (and the
 *   caller didn't provide one), we stamp `now()` on its behalf.
 */
export async function updatePost(
  id: string,
  input: UpdatePostInput,
): Promise<PostWithRelations> {
  const current = await db.post.findUnique({ where: { id } })
  if (!current) {
    throw errors.notFound(`Post ${id} not found`)
  }

  if (input.slug && input.slug !== current.slug) {
    const clash = await db.post.findUnique({ where: { slug: input.slug } })
    if (clash) {
      throw errors.conflict(`Post with slug "${input.slug}" already exists`)
    }
  }

  if (input.translations) {
    assertUniqueLocales(input.translations)
  }

  // Pre-resolve tag rows outside the transaction — upsertTagsBySlug runs its
  // own writes that don't need to share a snapshot with the post update.
  const tagRows =
    input.tags !== undefined
      ? input.tags.length > 0
        ? await upsertTagsBySlug(input.tags.map((slug) => ({ slug })))
        : []
      : null

  const data: Prisma.PostUpdateInput = {}
  if (input.slug !== undefined) data.slug = input.slug
  if (input.cover !== undefined) data.cover = input.cover ?? null
  if (input.status !== undefined) data.status = input.status
  if (input.columnId !== undefined) {
    data.column = input.columnId
      ? { connect: { id: input.columnId } }
      : { disconnect: true }
  }

  // publishedAt needs the resolved status to decide auto-stamping.
  if (input.publishedAt !== undefined || input.status !== undefined) {
    const nextStatus = input.status ?? current.status
    const nextPublishedAt = resolvePublishedAt(
      nextStatus,
      input.publishedAt === undefined
        ? current.publishedAt
        : input.publishedAt ?? null,
      current.publishedAt,
    )
    data.publishedAt = nextPublishedAt
  }

  return db.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.post.update({ where: { id }, data })
    }

    if (input.translations) {
      for (const t of input.translations) {
        await tx.postTranslation.upsert({
          where: { postId_locale: { postId: id, locale: t.locale } },
          create: {
            postId: id,
            locale: t.locale,
            title: t.title,
            excerpt: t.excerpt ?? null,
            content: t.content,
          },
          update: {
            title: t.title,
            excerpt: t.excerpt ?? null,
            content: t.content,
          },
        })
      }
    }

    if (tagRows !== null) {
      // Replace the full link set: deleting first means we can blindly
      // create the new ids without worrying about duplicates.
      await tx.tagsOnPosts.deleteMany({ where: { postId: id } })
      if (tagRows.length > 0) {
        await tx.tagsOnPosts.createMany({
          data: tagRows.map((t) => ({ postId: id, tagId: t.id })),
          skipDuplicates: true,
        })
      }
    }

    const updated = await tx.post.findUnique({
      where: { id },
      include: includeRelations,
    })
    if (!updated) {
      // Unreachable: we checked existence before the transaction.
      throw errors.notFound(`Post ${id} not found`)
    }
    return updated
  })
}

/**
 * Delete a post. PostTranslation / TagsOnPosts / PostView / PostLike /
 * Comment all cascade through the schema's `onDelete: Cascade`.
 */
export async function deletePost(id: string): Promise<void> {
  const current = await db.post.findUnique({ where: { id } })
  if (!current) {
    throw errors.notFound(`Post ${id} not found`)
  }
  await db.post.delete({ where: { id } })
}

// ---------- view counter ----------

/**
 * Record a view for the given slug, de-duped per `(postId, visitorHash, dayKey)`
 * (per systemPatterns §10).
 *
 * Returns:
 *   - `counted: true`  → first view this visitor+day, viewCount incremented.
 *   - `counted: false` → duplicate, no write to the counter.
 *
 * Throws `NOT_FOUND` if the slug doesn't resolve to a post. The unique
 * constraint on `PostView (postId, visitorHash, dayKey)` is the source of
 * truth for de-dup; we surface its `P2002` violation as "already counted".
 */
export async function incrementPostView(
  slug: string,
  visitorHash: string,
  dayKey: string,
): Promise<{ counted: boolean; viewCount: number }> {
  const post = await db.post.findUnique({
    where: { slug },
    select: { id: true, viewCount: true },
  })
  if (!post) {
    throw errors.notFound(`Post with slug "${slug}" not found`)
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.postView.create({
        data: { postId: post.id, visitorHash, dayKey },
      })
      const updated = await tx.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      })
      return updated.viewCount
    })
    return { counted: true, viewCount: result }
  } catch (e) {
    if (isUniqueViolation(e)) {
      // Duplicate within the same dayKey — no write, return current count.
      return { counted: false, viewCount: post.viewCount }
    }
    throw e
  }
}

// ---------- internal helpers ----------

function pickTranslation(
  rows: PostTranslation[],
  locale: Locale,
): PostTranslation | null {
  const exact = rows.find((r) => r.locale === locale)
  if (exact) return exact
  if (locale !== DEFAULT_LOCALE) {
    const fallback = rows.find((r) => r.locale === DEFAULT_LOCALE)
    if (fallback) return fallback
  }
  return rows[0] ?? null
}

function assertUniqueLocales(
  translations: ReadonlyArray<{ locale: string }>,
): void {
  const seen = new Set<string>()
  for (const t of translations) {
    if (seen.has(t.locale)) {
      throw errors.validation(
        `Duplicate translation locale "${t.locale}" in payload`,
      )
    }
    seen.add(t.locale)
  }
}

function resolvePublishedAt(
  status: PostStatus,
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
    // Prefer caller-supplied date; otherwise keep what we already had; only
    // stamp `now()` when neither side has one.
    return normalized ?? current ?? new Date()
  }
  return normalized ?? current
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "P2002"
  )
}
