# Spec 14 · Recommendation

> Trending score cron + 下一篇推荐（series-aware + similar tags）。
>
> Reference: `recommendation-algorithm.md` 全文

---

## Specs

完整 spec 见 `recommendation-algorithm.md` §12。摘要：

### Trending

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| trend-001 | viewCount=10000, likeCount=5, commentCount=3 | computeBaseScore | log10 压缩后 score 合理（不被 view 单一拉高） |
| trend-002 | 同一 entry t=0h vs t=72h | 计算 score | t=72h 的 score 约为 t=0h 的一半 |
| trend-003 | weights={view:1, like:3, comment:5} | 同条件 entry | comment 主导 score |
| trend-004 | Entry.status='DRAFT' | computeBaseScore | 返回 0 |
| trend-005 | publishedAt = NOW（t=0） | computeWithBoost | 含 0.1 newPostBoost |
| trend-006 | 跑 recomputeAllTrending | 后查 db | 所有 PUBLISHED entries.trendingScore 已更新 |
| trend-007 | mock cron lib + 启动 cron-runner | 等待 1 小时 cron tick | recomputeAllTrending 被调一次 |

### 下一篇

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| next-001 | Entry in series + seriesOrder=2 | findNextInSeries | 返回 seriesOrder=3 的 Entry |
| next-002 | Entry in series + 是 series 最后一篇 | findNextInSeries | 返回 null |
| next-003 | Entry 有 tags + 多个高 Jaccard 候选 | findSimilarEntries | 返回 score 最高 5 个 |
| next-004 | Entry 无 tag overlap | findSimilarEntries | fallback 到同 channel recent |
| next-005 | rare tag（只 1 个 entry 用）vs common tag（10 个 entry 用） | tagIdfWeights | rare tag 权重 > common tag |
| next-006 | 综合 getNextEntry on series entry | 调 | 返回 reason='series' |
| next-007 | 综合 getNextEntry on no-series entry with similar | 调 | 返回 reason='similar' |
| next-008 | 综合 getNextEntry on isolated entry | 调 | 返回 reason='recent' |

### Cron 部署

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| cron-001 | docker-compose up | 启动 cron service | logs 含 "[cron] runner started" |
| cron-002 | 真实跑 cron 1 小时 | 看 db | 全部 entries 的 trendingScore 已更新且时间戳 < 1 小时 |
| cron-003 | 跑 cleanupOldRateLimitLogs | 给 1 行 32 天日志 + 1 行 1 天日志 | 删除 32 天那条，保留 1 天 |

---

## Test File

- `src/lib/services/trending.test.ts` → trend-001 ~ trend-005
- `src/lib/services/similarEntries.test.ts` → next-003 ~ next-005
- `src/lib/services/nextEntry.test.ts` → next-001, next-002, next-006 ~ next-008
- `src/lib/jobs/cron-runner.test.ts` → cron-001 (mock)
- `src/lib/jobs/recomputeTrending.test.ts` → trend-006, cron-002 (integration)
- `src/lib/security/rateLimit.test.ts` → cron-003

---

## Acceptance

- [ ] trend / next / cron 全 spec 通过
- [ ] 首页 trending 区显示实时数据
- [ ] 文章详情下一篇推荐工作

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
