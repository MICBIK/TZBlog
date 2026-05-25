import type { ChannelKind } from "@prisma/client";

const previewLimitByKind: Partial<Record<ChannelKind, number>> = {
  ARTICLES: 3,
  STREAM: 5,
};

export function previewLimitForKind(kind: ChannelKind): number {
  return previewLimitByKind[kind] ?? 3;
}

export function resolveTrendingEntries<
  T extends { trendingScore: number; publishedAt: Date | null },
>(byScore: readonly T[], byRecency: readonly T[], limit = 5): T[] {
  return byScore.slice(0, limit);
}
