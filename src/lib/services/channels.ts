import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { errors } from "@/lib/errors"
import type {
  CreateChannelInput,
  UpdateChannelInput,
} from "@/lib/schemas/channel"
import { isLayoutAllowedForChannelKind } from "@/lib/schemas/channelEntryRules"

const channelListInclude = {
  translations: { orderBy: { locale: "asc" } },
  _count: { select: { entries: true } },
} satisfies Prisma.ChannelInclude

const channelDetailInclude = {
  translations: { orderBy: { locale: "asc" } },
} satisfies Prisma.ChannelInclude

const channelPageInclude = {
  translations: { orderBy: { locale: "asc" } },
  entries: {
    where: { status: "PUBLISHED" },
    orderBy: [
      { publishedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    include: {
      translations: { orderBy: { locale: "asc" } },
      tags: { include: { tag: true } },
    },
  },
} satisfies Prisma.ChannelInclude

export type ChannelPageData = Prisma.ChannelGetPayload<{
  include: typeof channelPageInclude
}>

export async function listChannels() {
  const rows = await db.channel.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: channelListInclude,
  })

  return rows.map((channel) => ({
    ...channel,
    entryCount: channel._count.entries,
  }))
}

export async function getChannelById(id: string) {
  return db.channel.findUnique({
    where: { id },
    include: channelDetailInclude,
  })
}

export async function createChannel(input: CreateChannelInput) {
  if (input.kind === "GUESTBOOK") {
    throw errors.validation("GUESTBOOK 由 seed 创建，admin 不能新建")
  }

  if (!isLayoutAllowedForChannelKind(input.kind, input.layout)) {
    throw errors.validation(
      `Layout ${input.layout} is not allowed for channel kind ${input.kind}`,
    )
  }

  assertUniqueLocales(input.translations)

  const existing = await db.channel.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  })
  if (existing) {
    throw errors.conflict(`Channel with slug "${input.slug}" already exists`)
  }

  const created = await db.channel.create({
    data: {
      slug: input.slug,
      order: await nextOrder(),
      enabled: input.enabled,
      kind: input.kind,
      layout: input.layout,
      translations: {
        create: input.translations.map((translation) => ({
          locale: translation.locale,
          name: translation.name,
          description: translation.description ?? null,
        })),
      },
    },
    include: channelDetailInclude,
  })

  return created
}

export async function updateChannel(id: string, input: UpdateChannelInput) {
  const current = await db.channel.findUnique({
    where: { id },
    include: channelDetailInclude,
  })
  if (!current) {
    throw errors.notFound(`Channel ${id} not found`)
  }

  if (input.kind === "GUESTBOOK" && current.kind !== "GUESTBOOK") {
    throw errors.validation("GUESTBOOK 由 seed 创建，admin 不能新建")
  }

  if (input.slug && input.slug !== current.slug) {
    const clash = await db.channel.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    })
    if (clash) {
      throw errors.conflict(`Channel with slug "${input.slug}" already exists`)
    }
  }

  if (input.translations) {
    assertUniqueLocales(input.translations)
  }

  const nextKind = input.kind ?? current.kind
  const nextLayout = input.layout ?? current.layout
  if (!isLayoutAllowedForChannelKind(nextKind, nextLayout)) {
    throw errors.validation(
      `Layout ${nextLayout} is not allowed for channel kind ${nextKind}`,
    )
  }

  const data: Prisma.ChannelUpdateInput = {}
  if (input.slug !== undefined) data.slug = input.slug
  if (input.kind !== undefined) data.kind = input.kind
  if (input.layout !== undefined) data.layout = input.layout
  if (input.enabled !== undefined) data.enabled = input.enabled

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
      include: channelDetailInclude,
    })
    if (!updated) {
      throw errors.notFound(`Channel ${id} not found`)
    }

    return updated
  })
}

export async function getChannelPageBySlug(
  slug: string,
): Promise<ChannelPageData | null> {
  return db.channel.findUnique({
    where: { slug },
    include: channelPageInclude,
  })
}

export async function deleteChannel(id: string): Promise<void> {
  const current = await db.channel.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!current) {
    throw errors.notFound(`Channel ${id} not found`)
  }

  await db.channel.delete({ where: { id } })
}

async function nextOrder(): Promise<number> {
  const top = await db.channel.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  })
  return top ? top.order + 1 : 0
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
