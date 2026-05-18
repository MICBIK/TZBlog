import type { Column, ColumnTranslation, Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { errors } from "@/lib/errors"
import type {
  CreateColumnInput,
  UpdateColumnInput,
} from "@/lib/schemas/column"

/**
 * Column service — owns the multi-table workflows for the Column +
 * ColumnTranslation pair (per systemPatterns §3 §7).
 *
 * Single-table reads stay in this module too so the admin REST routes have one
 * import surface. Slug uniqueness, automatic ordering, and translation upserts
 * are coordinated here rather than in route handlers.
 */

export type ColumnWithTranslations = Column & {
  translations: ColumnTranslation[]
}

/**
 * Flat row used by the public/listing UI for a specific locale: column fields
 * plus the chosen translation's `name` / `description` lifted to the top level.
 */
export type ColumnForLocale = Omit<Column, never> & {
  name: string
  description: string | null
}

const includeTranslations = {
  translations: true,
} satisfies Prisma.ColumnInclude

/** All columns ordered by `order asc, createdAt asc`, with their translations. */
export async function listColumns(): Promise<ColumnWithTranslations[]> {
  return db.column.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: includeTranslations,
  })
}

/**
 * Columns for the given locale, with the matching translation lifted onto each
 * row. Columns missing a translation in `locale` are skipped — the admin must
 * provide one before they appear in that locale's frontend.
 */
export async function listColumnsForLocale(
  locale: string,
): Promise<ColumnForLocale[]> {
  const rows = await db.column.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      translations: { where: { locale } },
    },
  })

  return rows
    .filter((c) => c.translations.length > 0)
    .map((c) => {
      const t = c.translations[0]
      const { translations: _omit, ...rest } = c
      void _omit
      return {
        ...rest,
        name: t.name,
        description: t.description,
      }
    })
}

export async function getColumnById(
  id: string,
): Promise<ColumnWithTranslations | null> {
  return db.column.findUnique({
    where: { id },
    include: includeTranslations,
  })
}

export async function getColumnBySlug(
  slug: string,
): Promise<ColumnWithTranslations | null> {
  return db.column.findUnique({
    where: { slug },
    include: includeTranslations,
  })
}

/**
 * Create a column + its translations atomically.
 *
 * - Rejects with `CONFLICT` if `slug` already exists.
 * - Rejects with `VALIDATION_ERROR` if translations contain duplicate locales
 *   (the unique index would catch it, but failing early gives a clearer error).
 * - When `order` is omitted, picks `max(order) + 1` so new columns land at the
 *   end of the admin list.
 */
export async function createColumn(
  input: CreateColumnInput,
): Promise<ColumnWithTranslations> {
  if (!Array.isArray(input.translations) || input.translations.length === 0) {
    throw errors.validation("At least one translation is required")
  }
  assertUniqueLocales(input.translations)

  const existing = await db.column.findUnique({ where: { slug: input.slug } })
  if (existing) {
    throw errors.conflict(`Column with slug "${input.slug}" already exists`)
  }

  const order = input.order ?? (await nextOrder())

  return db.column.create({
    data: {
      slug: input.slug,
      cover: input.cover ?? null,
      order,
      translations: {
        create: input.translations.map((t) => ({
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
        })),
      },
    },
    include: includeTranslations,
  })
}

/**
 * Update a column. Translations included in `input.translations` are upserted
 * by `(columnId, locale)`; translations for locales not in the array are left
 * untouched. To remove a locale's translation, delete the column or expose a
 * dedicated endpoint later.
 */
export async function updateColumn(
  id: string,
  input: UpdateColumnInput,
): Promise<ColumnWithTranslations> {
  const current = await db.column.findUnique({ where: { id } })
  if (!current) {
    throw errors.notFound(`Column ${id} not found`)
  }

  if (input.slug && input.slug !== current.slug) {
    const clash = await db.column.findUnique({ where: { slug: input.slug } })
    if (clash) {
      throw errors.conflict(`Column with slug "${input.slug}" already exists`)
    }
  }

  if (input.translations) {
    assertUniqueLocales(input.translations)
  }

  const data: Prisma.ColumnUpdateInput = {}
  if (input.slug !== undefined) data.slug = input.slug
  if (input.cover !== undefined) data.cover = input.cover ?? null
  if (input.order !== undefined) data.order = input.order

  return db.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.column.update({ where: { id }, data })
    }

    if (input.translations) {
      for (const t of input.translations) {
        await tx.columnTranslation.upsert({
          where: { columnId_locale: { columnId: id, locale: t.locale } },
          create: {
            columnId: id,
            locale: t.locale,
            name: t.name,
            description: t.description ?? null,
          },
          update: {
            name: t.name,
            description: t.description ?? null,
          },
        })
      }
    }

    const updated = await tx.column.findUnique({
      where: { id },
      include: includeTranslations,
    })
    if (!updated) {
      // Should be unreachable: we held the row across the transaction.
      throw errors.notFound(`Column ${id} not found`)
    }
    return updated
  })
}

/**
 * Delete a column. ColumnTranslation rows cascade via the schema's
 * `onDelete: Cascade`. Posts referencing this column have `columnId` set to
 * NULL by Prisma per the optional relation.
 */
export async function deleteColumn(id: string): Promise<void> {
  const current = await db.column.findUnique({ where: { id } })
  if (!current) {
    throw errors.notFound(`Column ${id} not found`)
  }
  await db.column.delete({ where: { id } })
}

/**
 * Persist a new sort order. The column at index `i` in `ids` receives
 * `order = i`. All ids must reference existing columns; the entire reorder
 * runs in one transaction so the UI never observes a partial state.
 */
export async function reorderColumns(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    throw errors.validation("ids must contain at least one column id")
  }

  const unique = new Set(ids)
  if (unique.size !== ids.length) {
    throw errors.validation("ids must not contain duplicates")
  }

  const found = await db.column.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  })
  if (found.length !== ids.length) {
    const foundIds = new Set(found.map((c) => c.id))
    const missing = ids.filter((id) => !foundIds.has(id))
    throw errors.notFound(`Columns not found: ${missing.join(", ")}`)
  }

  await db.$transaction(
    ids.map((id, index) =>
      db.column.update({ where: { id }, data: { order: index } }),
    ),
  )
}

/** Number of posts assigned to this column — used by the public column page. */
export async function countPostsInColumn(columnId: string): Promise<number> {
  return db.post.count({ where: { columnId } })
}

// ---------- internal helpers ----------

async function nextOrder(): Promise<number> {
  const top = await db.column.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  })
  return top ? top.order + 1 : 0
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
