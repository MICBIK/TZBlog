import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { errors } from "@/lib/errors"

const channelListInclude = {
  translations: { orderBy: { locale: "asc" } },
  _count: { select: { entries: true } },
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
