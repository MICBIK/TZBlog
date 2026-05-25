import { createEntry } from "@/lib/services/entries";
import { testDb } from "./db";

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

export async function createTestArticle(
  authorId: string,
  input: {
    slug: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    title?: string;
    content?: string;
    tags?: string[];
  },
) {
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
