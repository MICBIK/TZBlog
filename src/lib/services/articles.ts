import type {
  Channel,
  ChannelTranslation,
  EntryStatus,
  EntryTranslation,
  Prisma,
  Tag,
} from "@prisma/client";

import { db } from "@/lib/db";
import { errors } from "@/lib/errors";
import type { Locale } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import type { ArticleFilterInput } from "@/lib/schemas/entry";
import { incrementEntryView } from "@/lib/services/entryPublic";

export type ArticleWithRelations = {
  id: string;
  slug: string;
  cover: string | null;
  status: EntryStatus;
  publishedAt: Date | null;
  authorId: string;
  channelId: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  translations: Array<{
    id: string;
    locale: string;
    title: string;
    excerpt: string | null;
    content: string;
    entryId?: string;
  }>;
  channel: (Channel & { translations: ChannelTranslation[] }) | null;
  tags: Array<{ tag: Tag }>;
  author: { id: string; email: string; name: string | null };
};

export type ArticleListItem = {
  id: string;
  slug: string;
  cover: string | null;
  status: EntryStatus;
  publishedAt: Date | null;
  channelId: string | null;
  channelName: string | null;
  authorName: string | null;
  title: string;
  excerpt: string | null;
  tags: Array<{ slug: string; name: string }>;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
};

const includeRelations = {
  translations: true,
  channel: { include: { translations: true } },
  tags: { include: { tag: true } },
  author: { select: { id: true, email: true, name: true } },
} satisfies Prisma.EntryInclude;

type EntryWithRelations = Prisma.EntryGetPayload<{
  include: typeof includeRelations;
}>;

export async function listArticles(
  filter: ArticleFilterInput,
  locale: Locale,
): Promise<{
  items: ArticleListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const where: Prisma.EntryWhereInput = { kind: "ARTICLE" };

  if (filter.status) where.status = filter.status;
  if (filter.channelId) where.channelId = filter.channelId;
  if (filter.tag) {
    where.tags = { some: { tag: { slug: filter.tag } } };
  }
  if (filter.q && filter.q.trim()) {
    where.translations = {
      some: {
        locale,
        title: { contains: filter.q.trim(), mode: "insensitive" },
      },
    };
  }

  const orderBy: Prisma.EntryOrderByWithRelationInput[] =
    filter.status === "PUBLISHED"
      ? [{ publishedAt: { sort: "desc", nulls: "last" } }]
      : [{ updatedAt: "desc" }];

  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    db.entry.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: includeRelations,
    }),
    db.entry.count({ where }),
  ]);

  const items: ArticleListItem[] = rows.map((entry) => {
    const tr = pickTranslation(entry.translations, locale);
    const metadata = readArticleMetadata(entry.metadata);
    const channelTr = pickChannelTranslation(entry.channel.translations, locale);

    return {
      id: entry.id,
      slug: entry.slug,
      cover: metadata.cover,
      status: entry.status,
      publishedAt: entry.publishedAt,
      channelId: entry.channelId,
      channelName: channelTr?.name ?? null,
      authorName: entry.author.name,
      title: tr?.title ?? "(untitled)",
      excerpt: tr?.excerpt ?? null,
      tags: entry.tags.map((t) => ({ slug: t.tag.slug, name: t.tag.name })),
      viewCount: entry.viewCount,
      likeCount: entry.likeCount,
      commentCount: entry.commentCount,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  });

  return { items, total, page, pageSize };
}

export async function getArticleBySlug(
  slug: string,
): Promise<ArticleWithRelations | null> {
  const row = await db.entry.findFirst({
    where: { slug, kind: "ARTICLE", status: "PUBLISHED" },
    include: includeRelations,
  });
  return row ? toArticleCompat(row) : null;
}

export async function listAllPublishedArticleSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  const pageSize = 100;
  const rows: Array<{ slug: string; updatedAt: Date }> = [];

  for (let page = 0; ; page += 1) {
    const batch = await db.entry.findMany({
      where: { kind: "ARTICLE", status: "PUBLISHED" },
      orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }],
      skip: page * pageSize,
      take: pageSize,
      select: { slug: true, updatedAt: true },
    });

    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  return rows;
}

export async function incrementArticleView(
  slug: string,
  visitorHash: string,
  dayKey: string,
): Promise<{ counted: boolean; viewCount: number }> {
  const entry = await db.entry.findFirst({
    where: { slug, kind: "ARTICLE", status: "PUBLISHED" },
    select: { id: true },
  });
  if (!entry) {
    throw errors.notFound(`Article with slug "${slug}" not found`);
  }
  return incrementEntryView(entry.id, visitorHash, dayKey);
}

function toArticleCompat(entry: EntryWithRelations): ArticleWithRelations {
  const metadata = readArticleMetadata(entry.metadata);
  return {
    ...entry,
    cover: metadata.cover,
    channelId: entry.channelId,
    channel: entry.channel,
    translations: entry.translations.map((translation) => ({
      ...translation,
      content: entry.body,
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

function pickChannelTranslation(
  rows: ChannelTranslation[],
  locale: Locale,
): ChannelTranslation | null {
  const exact = rows.find((row) => row.locale === locale);
  if (exact) return exact;
  if (locale !== DEFAULT_LOCALE) {
    const fallback = rows.find((row) => row.locale === DEFAULT_LOCALE);
    if (fallback) return fallback;
  }
  return rows[0] ?? null;
}

function readArticleMetadata(raw: Prisma.JsonValue): {
  cover: string | null;
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { cover: null };
  }
  const value = raw as Record<string, unknown>;
  return {
    cover: typeof value.cover === "string" ? value.cover : null,
  };
}
