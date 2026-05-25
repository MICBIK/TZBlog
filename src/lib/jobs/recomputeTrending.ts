import { db } from "@/lib/db";
import {
  computeTrendingScoreWithBoost,
  DEFAULT_TRENDING_CONFIG,
  type TrendingConfig,
  type TrendingWeights,
} from "@/lib/services/trending";

export {
  computeBaseScore,
  computeTrendingScore,
  computeTrendingScoreWithBoost,
} from "@/lib/services/trending";

export async function recomputeAllTrending(): Promise<void> {
  const [config, entries] = await Promise.all([
    getTrendingConfig(),
    db.entry.findMany({
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
      },
    }),
  ]);

  if (entries.length === 0) return;

  const now = new Date();
  await db.$transaction(
    entries.map((entry) =>
      db.entry.update({
        where: { id: entry.id },
        data: {
          trendingScore: computeTrendingScoreWithBoost(entry, now, config),
        },
      }),
    ),
  );
}

async function getTrendingConfig(): Promise<TrendingConfig> {
  const siteConfig = await db.siteConfig.findUnique({
    where: { id: "singleton" },
    select: { metadata: true },
  });
  return parseTrendingConfig(siteConfig?.metadata);
}

function parseTrendingConfig(metadata: unknown): TrendingConfig {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return DEFAULT_TRENDING_CONFIG;
  }

  const trending = (metadata as Record<string, unknown>).trending;
  if (!trending || typeof trending !== "object" || Array.isArray(trending)) {
    return DEFAULT_TRENDING_CONFIG;
  }

  const raw = trending as Record<string, unknown>;
  const weights = readWeights(raw.weights);
  const halfLifeHours =
    typeof raw.halfLifeHours === "number" && raw.halfLifeHours > 0
      ? raw.halfLifeHours
      : DEFAULT_TRENDING_CONFIG.halfLifeHours;

  return { weights, halfLifeHours };
}

function readWeights(input: unknown): TrendingWeights {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return DEFAULT_TRENDING_CONFIG.weights;
  }

  const raw = input as Record<string, unknown>;
  return {
    view:
      typeof raw.view === "number" ? raw.view : DEFAULT_TRENDING_CONFIG.weights.view,
    like:
      typeof raw.like === "number" ? raw.like : DEFAULT_TRENDING_CONFIG.weights.like,
    comment:
      typeof raw.comment === "number"
        ? raw.comment
        : DEFAULT_TRENDING_CONFIG.weights.comment,
  };
}
