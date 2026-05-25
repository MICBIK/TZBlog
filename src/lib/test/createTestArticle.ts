import { createEntry } from "@/lib/services/entries";
import type { EntryWithRelationsCompat } from "@/lib/services/entries";
import { testDb } from "../../../tests/helpers/db";

export async function ensureArticlesChannelId(): Promise<string> {
  const existing = await testDb.column.findUnique({
    where: { slug: "articles" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await testDb.column.create({
    data: {
      slug: "articles",
      order: 0,
      enabled: true,
      kind: "ARTICLES",
      layout: "CHRONICLE",
      translations: { create: { locale: "zh", name: "文章", description: null } },
    },
    select: { id: true },
  });
  return created.id;
}

type LegacyCreateInput = {
  slug: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: Date | string | null;
  columnId?: string | null;
  cover?: string | null;
  tags?: string[];
  translations: Array<{
    locale: string;
    title: string;
    excerpt?: string | null;
    content: string;
  }>;
};

type SimpleCreateInput = {
  slug: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title?: string;
  content?: string;
  tags?: string[];
};

export async function createTestArticle(
  authorId: string,
  input: SimpleCreateInput,
): Promise<EntryWithRelationsCompat>;
export async function createTestArticle(
  input: LegacyCreateInput,
  authorId: string,
): Promise<EntryWithRelationsCompat>;
export async function createTestArticle(
  first: string | LegacyCreateInput,
  second: string | SimpleCreateInput,
): Promise<EntryWithRelationsCompat> {
  if (typeof first === "string") {
    const authorId = first;
    const input = second as SimpleCreateInput;
    const channelId = await ensureArticlesChannelId();
    return createEntry(
      {
        slug: input.slug,
        channelId,
        kind: "ARTICLE",
        status: input.status ?? "PUBLISHED",
        tags: input.tags ?? [],
        metadata: { cover: null, toc: true },
        translations: [
          {
            locale: "zh",
            title: input.title ?? input.slug,
            content: input.content ?? "正文",
          },
        ],
      },
      authorId,
    );
  }

  const input = first;
  const authorId = second as string;
  const channelId = input.columnId ?? (await ensureArticlesChannelId());
  return createEntry(
    {
      slug: input.slug,
      channelId,
      kind: "ARTICLE",
      status: input.status ?? "PUBLISHED",
      publishedAt: input.publishedAt ?? undefined,
      tags: input.tags ?? [],
      metadata: { cover: input.cover ?? null, toc: true },
      translations: input.translations.map((translation) => ({
        locale: translation.locale,
        title: translation.title,
        excerpt: translation.excerpt ?? null,
        content: translation.content,
      })),
    },
    authorId,
  );
}
