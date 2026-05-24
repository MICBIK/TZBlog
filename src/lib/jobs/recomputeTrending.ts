import { db } from "@/lib/db"

interface TrendingWeights {
  view: number
  like: number
  comment: number
}

interface TrendingConfig {
  weights: TrendingWeights
  halfLifeHours: number
}

const DEFAULT_TRENDING_CONFIG: TrendingConfig = {
  weights: { view: 1, like: 3, comment: 5 },
  halfLifeHours: 72,
}

export function computeTrendingScore(
  input: {
    status: string
    publishedAt: Date | null
    viewCount: number
    likeCount: number
    commentCount: number
  },
  now: Date = new Date(),
  config: TrendingConfig = DEFAULT_TRENDING_CONFIG,
): number {
  if (input.status !== "PUBLISHED" || !input.publishedAt) return 0

  const hoursOld = Math.max(
    0,
    (now.getTime() - input.publishedAt.getTime()) / (60 * 60 * 1000),
  )
  const decay = Math.exp((-Math.LN2 * hoursOld) / config.halfLifeHours)
  const signal =
    config.weights.view * Math.log10(input.viewCount + 1) +
    config.weights.like * Math.log10(input.likeCount + 1) +
    config.weights.comment * Math.log10(input.commentCount + 1)

  return signal * decay
}

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
  ])

  if (entries.length === 0) return

  const now = new Date()
  await db.$transaction(
    entries.map((entry) =>
      db.entry.update({
        where: { id: entry.id },
        data: {
          trendingScore: computeTrendingScore(entry, now, config),
        },
      }),
    ),
  )
}

async function getTrendingConfig(): Promise<TrendingConfig> {
  const siteConfig = await db.siteConfig.findUnique({
    where: { id: "singleton" },
    select: { metadata: true },
  })
  return parseTrendingConfig(siteConfig?.metadata)
}

function parseTrendingConfig(metadata: unknown): TrendingConfig {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return DEFAULT_TRENDING_CONFIG
  }

  const trending = (metadata as Record<string, unknown>).trending
  if (!trending || typeof trending !== "object" || Array.isArray(trending)) {
    return DEFAULT_TRENDING_CONFIG
  }

  const raw = trending as Record<string, unknown>
  const weights = readWeights(raw.weights)
  const halfLifeHours =
    typeof raw.halfLifeHours === "number" && raw.halfLifeHours > 0
      ? raw.halfLifeHours
      : DEFAULT_TRENDING_CONFIG.halfLifeHours

  return { weights, halfLifeHours }
}

function readWeights(input: unknown): TrendingWeights {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return DEFAULT_TRENDING_CONFIG.weights
  }

  const raw = input as Record<string, unknown>
  return {
    view:
      typeof raw.view === "number" ? raw.view : DEFAULT_TRENDING_CONFIG.weights.view,
    like:
      typeof raw.like === "number" ? raw.like : DEFAULT_TRENDING_CONFIG.weights.like,
    comment:
      typeof raw.comment === "number"
        ? raw.comment
        : DEFAULT_TRENDING_CONFIG.weights.comment,
  }
}
