import type {
  Channel,
  ChannelTranslation,
  EntryKind,
  EntryStatus,
  EntryTranslation,
  Prisma,
  Series,
  SeriesTranslation,
  Tag,
} from "@prisma/client";

import { db } from "@/lib/db";
import { getNextEntry } from "@/lib/services/nextEntry";
import { errors } from "@/lib/errors";
import type { Locale } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n";

const publicInclude = {
  translations: true,
  channel: { include: { translations: true } },
  tags: { include: { tag: true } },
  author: { select: { id: true, email: true, name: true } },
  series: { include: { translations: true } },
} satisfies Prisma.EntryInclude;

type EntryRow = Prisma.EntryGetPayload<{ include: typeof publicInclude }>;

export type PublicEntry = {
  id: string;
  slug: string;
  kind: EntryKind;
  status: EntryStatus;
  publishedAt: Date | null;
  body: string;
  metadata: Record<string, unknown>;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  seriesId: string | null;
  seriesOrder: number | null;
  author: { id: string; email: string; name: string | null };
  channel: Channel & { translations: ChannelTranslation[] };
  series:
    | (Series & { translations: SeriesTranslation[] })
    | null;
  tags: Array<{ tag: Tag }>;
  translations: Array<
    EntryTranslation & {
      content: string;
    }
  >;
};

export type NextEntrySuggestion = {
  kind: "series" | "similar" | "recent";
  title: string;
  href: string;
  seriesOrder?: number;
};

export async function getPublishedEntryBySlug(
  slug: string,
): Promise<PublicEntry | null> {
  const row = await db.entry.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: publicInclude,
  });
  return row ? toPublicEntry(row) : null;
}

export async function getPublishedEntryInChannel(
  channelSlug: string,
  entrySlug: string,
): Promise<PublicEntry | null> {
  const row = await db.entry.findFirst({
    where: {
      slug: entrySlug,
      status: "PUBLISHED",
      channel: { slug: channelSlug },
    },
    include: publicInclude,
  });
  return row ? toPublicEntry(row) : null;
}

export async function incrementEntryView(
  entryId: string,
  visitorHash: string,
  dayKey: string,
): Promise<{ counted: boolean; viewCount: number }> {
  const entry = await db.entry.findUnique({
    where: { id: entryId, status: "PUBLISHED" },
    select: { id: true, viewCount: true },
  });
  if (!entry) {
    throw errors.notFound(`Entry ${entryId} not found`);
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.entryView.create({
        data: { entryId: entry.id, visitorHash, dayKey },
      });
      const updated = await tx.entry.update({
        where: { id: entry.id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
      return updated.viewCount;
    });
    return { counted: true, viewCount: result };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { counted: false, viewCount: entry.viewCount };
    }
    throw error;
  }
}

export async function getEntryLikeState(
  entryId: string,
  visitorHash: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const entry = await db.entry.findUnique({
    where: { id: entryId, status: "PUBLISHED" },
    select: { likeCount: true },
  });
  if (!entry) {
    throw errors.notFound(`Entry ${entryId} not found`);
  }

  const liked = await db.entryLike.findFirst({
    where: { entryId, visitorHash },
    select: { id: true },
  });

  return { liked: liked !== null, likeCount: entry.likeCount };
}

export async function toggleEntryLike(
  entryId: string,
  visitorHash: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const entry = await db.entry.findUnique({
    where: { id: entryId, status: "PUBLISHED" },
    select: { id: true, likeCount: true },
  });
  if (!entry) {
    throw errors.notFound(`Entry ${entryId} not found`);
  }

  const existing = await db.entryLike.findFirst({
    where: { entryId, visitorHash },
    select: { id: true },
  });

  if (existing) {
    const likeCount = await db.$transaction(async (tx) => {
      await tx.entryLike.delete({ where: { id: existing.id } });
      const updated = await tx.entry.update({
        where: { id: entryId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      return Math.max(0, updated.likeCount);
    });
    return { liked: false, likeCount };
  }

  const likeCount = await db.$transaction(async (tx) => {
    await tx.entryLike.create({ data: { entryId, visitorHash } });
    const updated = await tx.entry.update({
      where: { id: entryId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
    return updated.likeCount;
  });

  return { liked: true, likeCount };
}

export async function getNextEntrySuggestion(
  entry: PublicEntry,
  locale: Locale,
): Promise<NextEntrySuggestion | null> {
  const { entry: next, reason } = await getNextEntry(entry.id);
  if (!next || !reason) return null;

  const tr = pickTranslation(next.translations, locale);
  return {
    kind: reason,
    title: tr?.title ?? next.slug,
    href: entryDetailHref(next.channel.slug, next.slug, next.kind),
    seriesOrder: reason === "series" ? (next.seriesOrder ?? undefined) : undefined,
  };
}

export function entryDetailHref(
  channelSlug: string,
  entrySlug: string,
  kind: EntryKind,
): string {
  if (kind === "ARTICLE" || kind === "REVIEW") {
    return `/posts/${entrySlug}`;
  }
  return `/c/${channelSlug}/${entrySlug}`;
}

export function pickEntryTranslation(
  entry: PublicEntry,
  locale: Locale,
): PublicEntry["translations"][number] | undefined {
  return (
    entry.translations.find((row) => row.locale === locale) ??
    entry.translations.find((row) => row.locale === DEFAULT_LOCALE) ??
    entry.translations[0]
  );
}

function toPublicEntry(row: EntryRow): PublicEntry {
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    status: row.status,
    publishedAt: row.publishedAt,
    body: row.body,
    metadata: readMetadata(row.metadata),
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    seriesId: row.seriesId,
    seriesOrder: row.seriesOrder,
    author: row.author,
    channel: row.channel,
    series: row.series,
    tags: row.tags,
    translations: row.translations.map((translation) => ({
      ...translation,
      content: row.body,
    })),
  };
}

function pickTranslation(
  rows: EntryTranslation[],
  locale: Locale,
): EntryTranslation | null {
  const exact = rows.find((row) => row.locale === locale);
  if (exact) return exact;
  if (locale !== DEFAULT_LOCALE) {
    const fallback = rows.find((row) => row.locale === DEFAULT_LOCALE);
    if (fallback) return fallback;
  }
  return rows[0] ?? null;
}

function readMetadata(raw: Prisma.JsonValue): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
