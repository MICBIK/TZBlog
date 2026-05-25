import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { findSimilarEntries } from "@/lib/services/similarEntries";

const entryInclude = {
  translations: true,
  channel: { select: { slug: true } },
} satisfies Prisma.EntryInclude;

export type NextEntryRow = Prisma.EntryGetPayload<{ include: typeof entryInclude }>;

export type NextEntryResult = {
  entry: NextEntryRow | null;
  reason: "series" | "similar" | "recent" | null;
};

export async function findNextInSeries(entryId: string): Promise<NextEntryRow | null> {
  const current = await db.entry.findUnique({
    where: { id: entryId },
    select: { seriesId: true, seriesOrder: true },
  });
  if (!current?.seriesId || current.seriesOrder === null) return null;

  return db.entry.findFirst({
    where: {
      seriesId: current.seriesId,
      seriesOrder: { gt: current.seriesOrder },
      status: "PUBLISHED",
    },
    orderBy: { seriesOrder: "asc" },
    include: entryInclude,
  });
}

export async function getNextEntry(entryId: string): Promise<NextEntryResult> {
  const seriesNext = await findNextInSeries(entryId);
  if (seriesNext) {
    return { entry: seriesNext, reason: "series" };
  }

  const similar = await findSimilarEntries(entryId, 1);
  if (similar.length > 0) {
    return { entry: similar[0], reason: "similar" };
  }

  const current = await db.entry.findUnique({
    where: { id: entryId },
    select: { channelId: true, publishedAt: true },
  });
  if (!current) {
    return { entry: null, reason: null };
  }

  const recent = await db.entry.findFirst({
    where: {
      channelId: current.channelId,
      status: "PUBLISHED",
      publishedAt: { lt: current.publishedAt ?? new Date() },
      id: { not: entryId },
    },
    orderBy: { publishedAt: "desc" },
    include: entryInclude,
  });

  return { entry: recent, reason: recent ? "recent" : null };
}
