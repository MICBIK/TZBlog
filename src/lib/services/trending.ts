export interface TrendingWeights {
  view: number;
  like: number;
  comment: number;
}

export interface TrendingConfig {
  weights: TrendingWeights;
  halfLifeHours: number;
}

export const DEFAULT_TRENDING_CONFIG: TrendingConfig = {
  weights: { view: 1, like: 3, comment: 5 },
  halfLifeHours: 72,
};

export interface TrendingScoreInput {
  status: string;
  publishedAt: Date | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export function computeBaseScore(
  input: TrendingScoreInput,
  now: Date = new Date(),
  config: TrendingConfig = DEFAULT_TRENDING_CONFIG,
): number {
  if (input.status !== "PUBLISHED" || !input.publishedAt) return 0;

  const hoursOld = Math.max(
    0,
    (now.getTime() - input.publishedAt.getTime()) / (60 * 60 * 1000),
  );
  const decay = Math.exp((-Math.LN2 * hoursOld) / config.halfLifeHours);
  const signal =
    config.weights.view * Math.log10(input.viewCount + 1) +
    config.weights.like * Math.log10(input.likeCount + 1) +
    config.weights.comment * Math.log10(input.commentCount + 1);

  return signal * decay;
}

export function computeTrendingScoreWithBoost(
  input: TrendingScoreInput,
  now: Date = new Date(),
  config: TrendingConfig = DEFAULT_TRENDING_CONFIG,
): number {
  if (input.status !== "PUBLISHED" || !input.publishedAt) return 0;

  const hoursOld = Math.max(
    0,
    (now.getTime() - input.publishedAt.getTime()) / (60 * 60 * 1000),
  );
  const baseScore = computeBaseScore(input, now, config);
  const newBoost = 0.1 * Math.exp((-Math.LN2 * hoursOld) / config.halfLifeHours);
  return baseScore + newBoost;
}

/** @deprecated Use computeBaseScore — kept for callers expecting the old name. */
export const computeTrendingScore = computeBaseScore;
