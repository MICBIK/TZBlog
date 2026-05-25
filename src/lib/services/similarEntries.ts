import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

const entryInclude = {
  translations: true,
  channel: { select: { slug: true } },
  tags: true,
} satisfies Prisma.EntryInclude;

export type SimilarEntry = Prisma.EntryGetPayload<{ include: typeof entryInclude }>;

export async function tagIdfWeights(): Promise<Map<string, number>> {
  const totalEntries = await db.entry.count({ where: { status: "PUBLISHED" } });
  const tagCounts = await db.tag.findMany({
    select: {
      id: true,
      _count: { select: { entries: true } },
    },
  });

  const weights = new Map<string, number>();
  for (const tag of tagCounts) {
    const idf = Math.log(totalEntries / (tag._count.entries + 1));
    weights.set(tag.id, idf);
  }
  return weights;
}

export function jaccardSimilarity(
  tagsA: Set<string>,
  tagsB: Set<string>,
  weights: Map<string, number>,
): number {
  const inter = [...tagsA].filter((tagId) => tagsB.has(tagId));
  const union = new Set([...tagsA, ...tagsB]);
  if (union.size === 0) return 0;

  const interW = inter.reduce((sum, tagId) => sum + (weights.get(tagId) ?? 1), 0);
  const unionW = [...union].reduce(
    (sum, tagId) => sum + (weights.get(tagId) ?? 1),
    0,
  );
  return unionW === 0 ? 0 : interW / unionW;
}

export async function findSimilarEntries(
  entryId: string,
  limit = 5,
): Promise<SimilarEntry[]> {
  const entry = await db.entry.findUnique({
    where: { id: entryId },
    include: { tags: true, channel: true },
  });
  if (!entry) return [];

  const myTags = new Set(entry.tags.map((row) => row.tagId));
  const weights = await tagIdfWeights();
  const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const pool = await db.entry.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: entryId },
      OR: [
        ...(myTags.size > 0
          ? [{ tags: { some: { tagId: { in: [...myTags] } } } }]
          : []),
        {
          channelId: entry.channelId,
          publishedAt: { gte: recentCutoff },
        },
      ],
    },
    include: entryInclude,
    take: 100,
  });

  const scored = pool.map((candidate) => {
    const otherTags = new Set(candidate.tags.map((row) => row.tagId));
    const tagSim = jaccardSimilarity(myTags, otherTags, weights);
    const sameChannel = candidate.channelId === entry.channelId ? 0.2 : 0;
    const trending = (candidate.trendingScore || 0) * 0.1;
    return { entry: candidate, score: tagSim + sameChannel + trending };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.entry);
}
