# Spec 05 · Home Composition

> 首页动态 Channel 渲染：每个 enabled Channel 渲染一个 preview block + trending 推荐区。
>
> Reference: `channel-meta-cms.md` §5 / `recommendation-algorithm.md` §3 / `demo-front/directions/01-aurora-portal.md`

---

## Specs

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| home-001 | 首页 `/` | 渲染 | 顶部 hero（SiteConfig.metadata.hero） + 多 Channel preview blocks（按 order asc） + trending 推荐区 |
| home-002 | seeded 3 enabled channels (ARTICLES/STREAM/GUESTBOOK) | 渲染 | 只显示 ARTICLES 和 STREAM（GUESTBOOK enabled=false） |
| home-003 | Channel ARTICLES preview block | 渲染 | 标题 + tagline + 最新 3 entries 卡片 + "查看全部 →" 链接 |
| home-004 | Channel STREAM preview block | 渲染 | 标题 + tagline + 最新 5 entries 列表 + "进入流 →" 链接 |
| home-005 | trending 推荐区 | 渲染 | 读 `Entry orderBy trendingScore desc limit 5 where status=PUBLISHED` |
| home-006 | trending 推荐区为空（新博客） | 渲染 | fallback 到最新 publishedAt 5 篇 |
| home-007 | SiteConfig.metadata.hero 含 avatar URL | 渲染 | `<img src=avatar />` |
| home-008 | 首页 Lighthouse mobile | 跑 | Performance ≥ 85 |
| home-009 | 首页 bundle size | 测量 | gzip < 250KB |
| home-010 | 加新 Channel via admin → enabled=true | 刷新 `/` | 新 channel preview block 出现，无前端代码改动 |

---

## Test File

- `src/app/(site)/page.test.tsx`
- `src/components/site/ChannelPreviewBlock.test.tsx`
- `src/components/site/HomeTrending.test.tsx`
- `e2e/home-dynamic-channel.spec.ts` → 010（Playwright）

---

## Acceptance

- [ ] 10 spec 全 pass
- [ ] home-010 是元模型**动态性**最终验证——必须 pass

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
