import type { Channel, ChannelTranslation, Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { errors } from "@/lib/errors"
import type {
  CreateColumnInput,
  UpdateColumnInput,
} from "@/lib/schemas/column"

export type ColumnWithTranslations = Channel & {
  cover: string | null
  translations: ChannelTranslation[]
}

export type ColumnForLocale = ColumnWithTranslations & {
  name: string
  description: string | null
}

const includeTranslations = {
  translations: true,
} satisfies Prisma.ChannelInclude

export async function listColumns(): Promise<ColumnWithTranslations[]> {
  const rows = await db.channel.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: includeTranslations,
  })
  return rows.map(toColumnCompat)
}

export async function listColumnsForLocale(
  locale: string,
): Promise<ColumnForLocale[]> {
  const rows = await db.channel.findMany({
    where: { kind: "ARTICLES" },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      translations: { where: { locale } },
    },
  })

  return rows
    .filter((channel) => channel.translations.length > 0)
    .map((channel) => {
      const translation = channel.translations[0]
      return {
        ...toColumnCompat(channel),
        name: translation.name,
        description: translation.description,
      }
    })
}

export async function getColumnById(
  id: string,
): Promise<ColumnWithTranslations | null> {
  const row = await db.channel.findUnique({
    where: { id },
    include: includeTranslations,
  })
  return row ? toColumnCompat(row) : null
}

export async function getColumnBySlug(
  slug: string,
): Promise<ColumnWithTranslations | null> {
  const row = await db.channel.findUnique({
    where: { slug },
    include: includeTranslations,
  })
  return row ? toColumnCompat(row) : null
}

export async function createColumn(
  input: CreateColumnInput,
): Promise<ColumnWithTranslations> {
  if (!Array.isArray(input.translations) || input.translations.length === 0) {
    throw errors.validation("At least one translation is required")
  }
  assertUniqueLocales(input.translations)

  const existing = await db.channel.findUnique({ where: { slug: input.slug } })
  if (existing) {
    throw errors.conflict(`Channel with slug "${input.slug}" already exists`)
  }

  const order = input.order ?? (await nextOrder())
  const created = await db.channel.create({
    data: {
      slug: input.slug,
      order,
      enabled: true,
      kind: "ARTICLES",
      layout: "CHRONICLE",
      translations: {
        create: input.translations.map((translation) => ({
          locale: translation.locale,
          name: translation.name,
          description: translation.description ?? null,
        })),
      },
    },
    include: includeTranslations,
  })

  return toColumnCompat(created)
}

export async function updateColumn(
  id: string,
  input: UpdateColumnInput,
): Promise<ColumnWithTranslations> {
  const current = await db.channel.findUnique({ where: { id } })
  if (!current) {
    throw errors.notFound(`Channel ${id} not found`)
  }

  if (input.slug && input.slug !== current.slug) {
    const clash = await db.channel.findUnique({ where: { slug: input.slug } })
    if (clash) {
      throw errors.conflict(`Channel with slug "${input.slug}" already exists`)
    }
  }

  if (input.translations) {
    assertUniqueLocales(input.translations)
  }

  const data: Prisma.ChannelUpdateInput = {}
  if (input.slug !== undefined) data.slug = input.slug
  if (input.order !== undefined) data.order = input.order

  return db.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.channel.update({ where: { id }, data })
    }

    if (input.translations) {
      for (const translation of input.translations) {
        await tx.channelTranslation.upsert({
          where: {
            channelId_locale: { channelId: id, locale: translation.locale },
          },
          create: {
            channelId: id,
            locale: translation.locale,
            name: translation.name,
            description: translation.description ?? null,
          },
          update: {
            name: translation.name,
            description: translation.description ?? null,
          },
        })
      }
    }

    const updated = await tx.channel.findUnique({
      where: { id },
      include: includeTranslations,
    })
    if (!updated) {
      throw errors.notFound(`Channel ${id} not found`)
    }
    return toColumnCompat(updated)
  })
}

export async function deleteColumn(id: string): Promise<void> {
  const current = await db.channel.findUnique({ where: { id } })
  if (!current) {
    throw errors.notFound(`Channel ${id} not found`)
  }
  await db.channel.delete({ where: { id } })
}

export async function reorderColumns(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    throw errors.validation("ids must contain at least one channel id")
  }

  const unique = new Set(ids)
  if (unique.size !== ids.length) {
    throw errors.validation("ids must not contain duplicates")
  }

  const found = await db.channel.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  })
  if (found.length !== ids.length) {
    const foundIds = new Set(found.map((channel) => channel.id))
    const missing = ids.filter((id) => !foundIds.has(id))
    throw errors.notFound(`Channels not found: ${missing.join(", ")}`)
  }

  await db.$transaction(
    ids.map((id, index) =>
      db.channel.update({ where: { id }, data: { order: index } }),
    ),
  )
}

export async function countPostsInColumn(channelId: string): Promise<number> {
  return db.entry.count({ where: { channelId, kind: "ARTICLE" } })
}

async function nextOrder(): Promise<number> {
  const top = await db.channel.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  })
  return top ? top.order + 1 : 0
}

function toColumnCompat<T extends Channel & { translations: ChannelTranslation[] }>(
  channel: T,
): T & { cover: string | null } {
  return { ...channel, cover: null }
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
