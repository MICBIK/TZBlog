import type {
  Channel,
  ChannelTranslation,
  EntryStatus,
  Prisma,
  Tag,
} from "@prisma/client";

import { db } from "@/lib/db";
import { errors } from "@/lib/errors";
import type { EntryKindForMetadata } from "@/lib/schemas/entryMetadata";
import { parseEntryMetadata } from "@/lib/schemas/entryMetadata";
import { isEntryKindAllowedForChannelKind } from "@/lib/schemas/channelEntryRules";
import type { CreateEntryInput } from "@/lib/schemas/entry";
import { upsertTagsBySlug } from "@/lib/services/tags";

const includeRelations = {
  translations: true,
  channel: { include: { translations: true } },
  tags: { include: { tag: true } },
  author: { select: { id: true, email: true, name: true } },
} satisfies Prisma.EntryInclude;

type EntryWithRelations = Prisma.EntryGetPayload<{
  include: typeof includeRelations;
}>;

export type EntryWithRelationsCompat = {
  id: string;
  slug: string;
  kind: string;
  status: EntryStatus;
  publishedAt: Date | null;
  authorId: string;
  channelId: string;
  seriesId: string | null;
  seriesOrder: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  translations: Array<{
    id: string;
    locale: string;
    title: string;
    excerpt: string | null;
    content: string;
    entryId: string;
  }>;
  channel: Channel & { translations: ChannelTranslation[] };
  tags: Array<{ tag: Tag }>;
  author: { id: string; email: string; name: string | null };
};

export async function createEntry(
  input: CreateEntryInput,
  authorId: string,
): Promise<EntryWithRelationsCompat> {
  assertUniqueLocales(input.translations);

  const existing = await db.entry.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw errors.conflict(`Entry with slug "${input.slug}" already exists`);
  }

  const channel = await db.channel.findUnique({
    where: { id: input.channelId },
    select: { id: true, kind: true },
  });
  if (!channel) {
    throw errors.notFound(`Channel ${input.channelId} not found`);
  }
  if (channel.kind === "GUESTBOOK") {
    throw errors.forbidden("admin 不能手动创建 GUESTBOOK_THREAD");
  }
  if (!isEntryKindAllowedForChannelKind(channel.kind, input.kind)) {
    throw errors.validation(
      `Entry kind ${input.kind} is not allowed for channel kind ${channel.kind}`,
    );
  }

  const metadata = parseEntryMetadata(
    input.kind as EntryKindForMetadata,
    input.metadata,
  ).data;
  const tagRows =
    input.tags.length > 0
      ? await upsertTagsBySlug(input.tags.map((slug) => ({ slug })))
      : [];

  const created = await db.entry.create({
    data: {
      slug: input.slug,
      channelId: input.channelId,
      authorId,
      kind: input.kind,
      status: input.status,
      publishedAt: resolvePublishedAt(
        input.status,
        input.publishedAt ?? null,
        null,
      ),
      body: input.translations[0]?.content ?? "",
      metadata,
      seriesId: input.seriesId ?? null,
      seriesOrder: input.seriesOrder ?? null,
      translations: {
        create: input.translations.map((translation) => ({
          locale: translation.locale,
          title: translation.title,
          excerpt: translation.excerpt ?? null,
        })),
      },
      tags:
        tagRows.length > 0
          ? { create: tagRows.map((tag) => ({ tagId: tag.id })) }
          : undefined,
    },
    include: includeRelations,
  });

  return toEntryCompat(created);
}

function toEntryCompat(entry: EntryWithRelations): EntryWithRelationsCompat {
  return {
    ...entry,
    metadata:
      typeof entry.metadata === "object" && entry.metadata !== null
        ? (entry.metadata as Record<string, unknown>)
        : {},
    translations: entry.translations.map((translation) => ({
      ...translation,
      content: entry.body,
      entryId: translation.entryId,
    })),
  };
}

function assertUniqueLocales(
  translations: ReadonlyArray<{ locale: string }>,
): void {
  const seen = new Set<string>();
  for (const translation of translations) {
    if (seen.has(translation.locale)) {
      throw errors.validation(
        `Duplicate translation locale "${translation.locale}" in payload`,
      );
    }
    seen.add(translation.locale);
  }
}

function resolvePublishedAt(
  status: EntryStatus,
  requested: string | Date | null,
  current: Date | null,
): Date | null {
  if (status === "DRAFT") return null;
  if (requested instanceof Date) return requested;
  if (typeof requested === "string" && requested) return new Date(requested);
  if (status === "PUBLISHED") return current ?? new Date();
  return current;
}
