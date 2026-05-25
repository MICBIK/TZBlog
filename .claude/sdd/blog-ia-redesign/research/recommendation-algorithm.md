# Recommendation Algorithm — Trending Score + Next Entry

> 决策来源：proposal §M5（trending + 下一篇）+ 7（首页推荐文章接 trending score，每小时刷新）+ 6（文章详情下一篇 series-aware + similar tag）。

---

## 1. 设计前提与符号约定

| 符号 | 含义 |
|------|------|
| V | viewCount（去重后） |
| L | likeCount |
| C | commentCount（已审核） |
| t | 距 publishedAt 的小时数 |
| H | 半衰期（小时，默认 72h = 3 天） |
| λ | 衰减因子 = `ln(2) / H` |
| w_v / w_l / w_c | 各信号权重（默认 1.0 / 3.0 / 5.0） |
| score | 最终 trending score |

---

## 2. 四种 trending 公式对比

### 2.1 Reddit "hot" 算法

```
score = log10(max(|s|, 1)) · sign(s) + (t / 45000)
其中 s = upvotes - downvotes, t = (createdAt - 2005-12-08).epoch
```

**特点**：log 压缩高分；时间是加法递增（每 12.5 小时 +1 分）。
**不适配**：博客没有 downvote；时间加法导致老内容永远沉底。

### 2.2 HN "ranking" 算法

```
score = (P - 1) / (T + 2) ^ G
其中 P = upvotes, T = age in hours, G = gravity (default 1.8)
```

**特点**：年龄幂律衰减，重力可调。
**不适配**：只看 upvote，没区分浏览/点赞/评论。

### 2.3 Wilson score interval（点赞率置信区间）

```
score = (p + z²/(2n) - z·sqrt(p(1-p)/n + z²/(4n²))) / (1 + z²/n)
其中 p = up/(up+down), n = total, z = 1.96
```

**特点**：解决"3 赞 100% vs 100 赞 95%"的小样本误判。
**不适配**：博客无 down vote；样本量普遍偏小。

### 2.4 Bayesian average（贝叶斯加权）

```
score = (C·m + sum(R)) / (C + N)
其中 C = 先验样本数, m = 全站均值, sum(R) = 该项实际评分总和, N = 实际样本数
```

**特点**：低样本回归均值，防止单条爆炸。
**不适配**：博客内容没有"评分"维度，只有 binary 信号。

---

## 3. TZBlog 最终公式

```
score = (w_v · log10(V + 1) + w_l · log10(L + 1) + w_c · log10(C + 1)) · exp(-λ · t)

λ = ln(2) / H = 0.693 / 72 ≈ 0.00963 (per hour)
```

### 3.1 推导逻辑

1. **三信号 log 压缩**：避免单一信号（如刷浏览）拉高 score
2. **权重区分**：评论权重 > 点赞 > 浏览，对应"创作互动度"递增
3. **指数衰减**：72 小时半衰期，第 3 天 score 减半，第 6 天减到 1/4
4. **publishedAt 起算**：草稿不计 score（默认 score = 0）

### 3.2 权重可配置

存 `SiteConfig.metadata.trending`：

```json
{
  "trending": {
    "weights": { "view": 1.0, "like": 3.0, "comment": 5.0 },
    "halfLifeHours": 72,
    "recomputeIntervalHours": 1
  }
}
```

后台 `/admin/settings/site` 可调。

### 3.3 边界处理

- 新发布（t < 1h）：分母接近 1，分数饱满，自然冷启动
- 老内容（t > 30 天）：score 接近 0，自动沉底
- 草稿 / 归档：跳过计算，score = 0

---

## 4. 写入策略

### 4.1 三种方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| A：每次 view/like/comment 触发实时更新 | 实时性高 | 高频写，行锁竞争，浪费 |
| B：cron 每 N 分钟全量重算 | 稳定，可控 | N 分钟内不准；全量扫描 |
| C：增量 delta + 周期重算（推荐） | 平衡实时与负载 | 实现稍复杂 |

### 4.2 推荐方案 C：每小时全量 + 写入时一阶 log 导数 delta

**写入时 delta**（评论/点赞/浏览的 server action 内）：

```typescript
// 增量公式：log10(N+1) - log10(N) ≈ 1/((N+0.5)·ln(10))
// 仅作用于"当前时间窗"的近似更新，cron 会校正
function approximateScoreDelta(currentCount: number, weight: number, hoursOld: number, halfLifeHours: number): number {
  const logDelta = 1 / ((currentCount + 0.5) * Math.LN10)
  const decay = Math.exp(-Math.LN2 * hoursOld / halfLifeHours)
  return weight * logDelta * decay
}
```

**cron 每小时全量**：

```typescript
async function recomputeAllTrending(): Promise<void> {
  const config = await getTrendingConfig()
  const { weights, halfLifeHours } = config

  const entries = await db.entry.findMany({
    where: { status: 'PUBLISHED', publishedAt: { not: null } },
    select: { id: true, viewCount: true, likeCount: true, commentCount: true, publishedAt: true },
  })

  for (const entry of entries) {
    const t = (Date.now() - entry.publishedAt!.getTime()) / (3600 * 1000)
    const decay = Math.exp(-Math.LN2 * t / halfLifeHours)
    const sig =
      weights.view * Math.log10(entry.viewCount + 1) +
      weights.like * Math.log10(entry.likeCount + 1) +
      weights.comment * Math.log10(entry.commentCount + 1)
    const score = sig * decay

    await db.entry.update({
      where: { id: entry.id },
      data: { trendingScore: score },
    })
  }
}
```

性能：1000 entry < 2 秒；10000 entry < 20 秒（实测顺序更新；批量 batch update 更快）。

---

## 5. 相似文章算法（"下一篇"用）

### 5.1 多路召回

```
candidates =
  Jaccard(tag_overlap) ≥ 0.3      → 高优先
  ∪ same_channel ∧ pub_within_30d → 中优先
  ∪ pg_trgm(title_similarity) ≥ 0.3 → 低优先（fallback）
```

### 5.2 Tag-IDF 加权 Jaccard

```typescript
async function tagIdfWeights(): Promise<Map<string, number>> {
  const totalEntries = await db.entry.count({ where: { status: 'PUBLISHED' } })
  const tagCounts = await db.tag.findMany({
    select: {
      id: true,
      _count: { select: { entries: true } },
    },
  })

  const weights = new Map<string, number>()
  for (const tag of tagCounts) {
    const idf = Math.log(totalEntries / (tag._count.entries + 1))
    weights.set(tag.id, idf)
  }
  return weights
}

function jaccardSimilarity(
  tagsA: Set<string>,
  tagsB: Set<string>,
  weights: Map<string, number>,
): number {
  const inter = [...tagsA].filter((t) => tagsB.has(t))
  const union = new Set([...tagsA, ...tagsB])
  if (union.size === 0) return 0

  const interW = inter.reduce((s, t) => s + (weights.get(t) ?? 1), 0)
  const unionW = [...union].reduce((s, t) => s + (weights.get(t) ?? 1), 0)
  return interW / unionW
}
```

### 5.3 `findSimilarEntries`

```typescript
export async function findSimilarEntries(
  entryId: string,
  limit = 5,
): Promise<Entry[]> {
  const entry = await db.entry.findUnique({
    where: { id: entryId },
    include: { tags: true, channel: true },
  })
  if (!entry) return []

  const myTags = new Set(entry.tags.map((t) => t.tagId))
  const weights = await tagIdfWeights()

  const pool = await db.entry.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: entryId },
      OR: [
        { tags: { some: { tagId: { in: [...myTags] } } } },
        { channelId: entry.channelId, publishedAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      ],
    },
    include: { tags: true },
    take: 100,
  })

  const scored = pool.map((e) => {
    const otherTags = new Set(e.tags.map((t) => t.tagId))
    const tagSim = jaccardSimilarity(myTags, otherTags, weights)
    const sameChannel = e.channelId === entry.channelId ? 0.2 : 0
    const trending = (e.trendingScore || 0) * 0.1
    return { entry: e, score: tagSim + sameChannel + trending }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry)
}
```

---

## 6. 系列下一篇

```typescript
export async function findNextInSeries(entryId: string): Promise<Entry | null> {
  const current = await db.entry.findUnique({
    where: { id: entryId },
    select: { seriesId: true, seriesOrder: true },
  })
  if (!current?.seriesId || current.seriesOrder === null) return null

  return db.entry.findFirst({
    where: {
      seriesId: current.seriesId,
      seriesOrder: { gt: current.seriesOrder },
      status: 'PUBLISHED',
    },
    orderBy: { seriesOrder: 'asc' },
  })
}
```

---

## 7. 综合"下一篇"入口

```typescript
export async function getNextEntry(entryId: string): Promise<{
  entry: Entry | null
  reason: 'series' | 'similar' | 'recent' | null
}> {
  // 1. series 优先
  const seriesNext = await findNextInSeries(entryId)
  if (seriesNext) return { entry: seriesNext, reason: 'series' }

  // 2. similar tags 兜底
  const similar = await findSimilarEntries(entryId, 1)
  if (similar.length > 0) return { entry: similar[0], reason: 'similar' }

  // 3. recent 兜底（同 channel 最新一篇）
  const current = await db.entry.findUnique({
    where: { id: entryId },
    select: { channelId: true, publishedAt: true },
  })
  if (!current) return { entry: null, reason: null }

  const recent = await db.entry.findFirst({
    where: {
      channelId: current.channelId,
      status: 'PUBLISHED',
      publishedAt: { lt: current.publishedAt ?? new Date() },
      id: { not: entryId },
    },
    orderBy: { publishedAt: 'desc' },
  })
  return { entry: recent, reason: recent ? 'recent' : null }
}
```

UI 显示时根据 reason 给前缀：
- series → "系列下一篇 · 第 N 章"
- similar → "你可能感兴趣"
- recent → "近期文章"

---

## 8. Cron 部署方案

### 8.1 三种方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| Vercel Cron | 零运维 | 项目自部署 VPS，不适用 |
| Next.js Route Handler + 外部 cron 触发 | 简单 | 需要外部触发器（cron-job.org / GitHub Actions） |
| 独立 docker-compose service 跑 node-cron | 自主可控（推荐） | 增加一个容器 |

### 8.2 推荐方案：独立 cron service

`docker/cron.Dockerfile`：

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile
COPY src ./src
COPY prisma ./prisma
RUN pnpm prisma generate
CMD ["node", "src/lib/jobs/cron-runner.js"]
```

`docker/docker-compose.yml` 追加：

```yaml
services:
  cron:
    build:
      context: ..
      dockerfile: docker/cron.Dockerfile
    env_file: .env.production
    restart: unless-stopped
    depends_on: [db]
```

`src/lib/jobs/cron-runner.ts`：

```typescript
import { CronJob } from 'cron'
import { recomputeAllTrending } from './recomputeTrending'
import { cleanupOldRateLimitLogs } from '@/lib/security/rateLimit'

// 每小时跑 trending
new CronJob('0 * * * *', async () => {
  try {
    await recomputeAllTrending()
    console.log('[cron] trending recomputed at', new Date().toISOString())
  } catch (err) {
    console.error('[cron] trending failed', err)
  }
}, null, true)

// 每天 03:00 清理旧 rate-limit 日志
new CronJob('0 3 * * *', async () => {
  try {
    const removed = await cleanupOldRateLimitLogs()
    console.log(`[cron] cleaned ${removed} old rate-limit entries`)
  } catch (err) {
    console.error('[cron] rate-limit cleanup failed', err)
  }
}, null, true)

console.log('[cron] runner started')
```

依赖：`pnpm add cron`

---

## 9. 性能预估

| Entry 数量 | trending 全量重算 | similar 查询单次 |
|-----------|------------------|-----------------|
| 100 | < 200ms | < 50ms |
| 1000 | ~2s | ~150ms |
| 10000 | ~20s | ~400ms |
| 100000 | ~3min | ~1s |

100K entry 时需要批量优化（参考 §11 性能优化建议）。

---

## 10. 冷启动 fallback

新发布 Entry 没有 view/like/comment，score 接近 0，会被老内容压住。加 newPostBoost：

```typescript
function trendingScoreWithBoost(entry: Entry, config: TrendingConfig): number {
  const t = (Date.now() - entry.publishedAt!.getTime()) / 3600000
  const baseScore = computeBaseScore(entry, config)
  const newBoost = 0.1 * Math.exp(-Math.LN2 * t / config.halfLifeHours)
  return baseScore + newBoost
}
```

新文章首小时 score 自带 0.1 加成，逐渐衰减。

---

## 11. 性能优化建议（V2 backlog）

- **批量 update**：`UPDATE entries SET trending_score = ... FROM (VALUES ...)`，1000 entry / 批
- **materialized view**：`CREATE MATERIALIZED VIEW similar_entries AS ...` + 每小时 REFRESH
- **Redis cache**：`getNextEntry(entryId)` 结果缓存 1 小时（key = entry:next:<id>）
- **pg_trgm 全文索引**：`CREATE INDEX entries_title_trgm ON entries USING gin (title gin_trgm_ops)`
- **离线推荐 job**：把 similar 计算搬到 cron，写入 `Entry.suggestedNext String?` 字段

---

## 12. 测试策略（详见 specs/14-recommendation）

| Spec-ID | 测试 | 层级 |
|---------|------|------|
| trend-001 | logarithmicScalingCompressesHighCount | unit |
| trend-002 | exponentialDecayHalvesScoreAtHalfLife | unit |
| trend-003 | weightedSumPrioritizesComments | unit |
| trend-004 | draftEntriesGetZeroScore | unit |
| trend-005 | newPostBoostGivesEarlyVisibility | unit |
| trend-006 | recomputeAllUpdatesAllPublishedEntries | integration |
| trend-007 | cronRunsHourly | integration (mock cron lib) |
| next-001 | seriesNextReturnsCorrectOrder | integration |
| next-002 | seriesEndReturnsNull | integration |
| next-003 | similarReturnsHighJaccardEntries | integration |
| next-004 | similarFallsBackToRecentWhenNoTagOverlap | integration |
| next-005 | tagIdfWeightsRareTagsHigher | unit |

---

## 13. 一次性集成 checklist（供 codex 执行）

- [ ] `pnpm add cron`
- [ ] Prisma `Entry.trendingScore: Float @default(0)`（已含在 channel-meta-cms.md）
- [ ] Prisma `Entry.seriesId: String?` / `seriesOrder: Int?`（同）
- [ ] `Entry.@@index([trendingScore(sort: Desc)])`
- [ ] `Entry.@@index([seriesId, seriesOrder])`
- [ ] 创建 `src/lib/services/trending.ts`（computeBaseScore + recomputeAllTrending）
- [ ] 创建 `src/lib/services/similarEntries.ts`（tagIdfWeights + jaccardSimilarity + findSimilarEntries）
- [ ] 创建 `src/lib/services/nextEntry.ts`（findNextInSeries + getNextEntry）
- [ ] 创建 `src/lib/jobs/cron-runner.ts`
- [ ] 创建 `docker/cron.Dockerfile`
- [ ] `docker/docker-compose.yml` 追加 cron service
- [ ] `SiteConfig.metadata.trending` 默认值 seed 一份
- [ ] 首页 `<HomeTrending />` 组件读 `Entry orderBy trendingScore desc limit 5`
- [ ] 文章详情 `<NextEntry entryId={...} />` 组件调 `getNextEntry`
- [ ] 跑 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:15:00Z -->
