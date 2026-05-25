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
  if (byScore.length === 0) {
    return byRecency.slice(0, limit);
  }

  if (byScore.every((entry) => entry.trendingScore === 0)) {
    return byRecency.slice(0, limit);
  }

  return byScore.slice(0, limit);
}
