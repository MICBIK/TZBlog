# Migration Plan — 破坏式数据迁移

> 开发期：drop 所有旧表 + reseed showcase，不保留任何用户数据，不保留 URL 兼容。
>
> Reference: `proposal.md` D7 / `design-notes.md` A6 / `schema-diff.md` 完整 diff / `specs/15-migration/capability.md` spec 表

---

## 0. 前置检查（codex 必读）

| 检查项 | 命令 / 验证 |
|--------|------------|
| 当前 git 干净（无 uncommitted changes） | `git status` 无 dirty |
| 本次 SDD 所有 research 已落盘 | `ls .claude/sdd/blog-ia-redesign/research/` 含 5 个 .md |
| 备份当前 dev db（防 ha1den 反悔）| `pnpm db:export-json` 输出到 `backup/<timestamp>.json` |
| `pnpm typecheck` 当前状态绿色 | 验证起点干净 |
| `pnpm test` 当前状态绿色 | 同上 |

如有任一项不满足 → **STOP** 报告 ha1den。

---

## 1. Schema 替换步骤

### Step 1.1 — 备份现 schema

```bash
cp prisma/schema.prisma prisma/schema.prisma.backup-2026-05-25
```

### Step 1.2 — 替换 schema 内容

按 `channel-meta-cms.md` §2.2 + `magic-link-auth.md` §3.2 + `schema-diff.md` 的完整 schema 写入 `prisma/schema.prisma`。

关键 model 完整清单：
- 删：Post / PostTranslation / Column / ColumnTranslation / TagsOnPosts / PostView / PostLike
- 删 enum：PostStatus
- 加 model：Channel / ChannelTranslation / Series / SeriesTranslation / Entry / EntryTranslation / TagsOnEntries / EntryView / EntryLike / RateLimitLog
- 加 enum：ChannelKind / ChannelLayout / EntryKind / EntryStatus / CommentVisibility
- 改 model：User（role 默认 VISITOR + relation 改 entries[]）/ Comment（postId→entryId + 加 authorUserId + visibility）/ Tag（relation 改 entries[]）
- 改 enum：Role 加 VISITOR

### Step 1.3 — 销毁旧 migration

```bash
rm -rf prisma/migrations/*  # 开发期可直接清掉历史 migration
```

⚠️ 破坏性操作，**HaiDen 已预授权**（详见 `codex-handoff.md` §0 + §5），codex 直接执行。

### Step 1.4 — 重建 migration

```bash
pnpm prisma migrate dev --name init-channel-entry-meta-model --create-only
```

人工审查生成的 SQL：
- 确认 DROP TABLE 顺序正确（先 child 后 parent）
- 确认 FOREIGN KEY ON DELETE CASCADE 已设置
- 确认 INDEX 全部创建

### Step 1.5 — 执行 migration

```bash
pnpm prisma migrate reset --force
```

`--force` 跳过交互确认（codex 自动化）。等价于：drop database → create database → apply migration → run seed。

---

## 2. Seed 数据规划

### 2.1 创建 `prisma/seed.ts`（重写）

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  // 1. Admin user
  const adminPassword = await bcrypt.hash('admin-2026-CHANGE-ME', 12)
  const admin = await db.user.upsert({
    where: { email: 'haiden@blog.haiden.dev' },
    create: {
      email: 'haiden@blog.haiden.dev',
      name: 'HaiDen',
      role: 'ADMIN',
      password: adminPassword,
    },
    update: { role: 'ADMIN' },
  })

  // 2. Tags
  const tagSlugs = ['systems', 'security', 'design', 'reading', 'travel', 'tooling']
  const tags = await Promise.all(
    tagSlugs.map((slug) =>
      db.tag.upsert({
        where: { slug },
        create: { slug, name: slug },
        update: {},
      }),
    ),
  )

  // 3. Channels
  const channelArticles = await db.channel.upsert({
    where: { slug: 'articles' },
    create: {
      slug: 'articles',
      order: 1,
      enabled: true,
      kind: 'ARTICLES',
      layout: 'CHRONICLE',
      icon: 'BookOpen',
      accentColor: 'var(--accent)',
      translations: {
        create: [{ locale: 'zh', name: '文章', description: '长文与思考', tagline: '在快的时代写慢一些的字' }],
      },
    },
    update: {},
  })

  const channelStream = await db.channel.upsert({
    where: { slug: 'stream' },
    create: {
      slug: 'stream',
      order: 2,
      enabled: true,
      kind: 'STREAM',
      layout: 'GREP',
      icon: 'Terminal',
      accentColor: 'var(--term-phosphor)',
      translations: {
        create: [{ locale: 'zh', name: '日志流', description: '链接、笔记、引语、碎片', tagline: 'grep my mind' }],
      },
    },
    update: {},
  })

  const channelGuestbook = await db.channel.upsert({
    where: { slug: 'guestbook' },
    create: {
      slug: 'guestbook',
      order: 99,
      enabled: false,  // GUESTBOOK 不在首页渲染
      kind: 'GUESTBOOK',
      layout: 'FEED',  // dummy，guestbook 走专用页
      icon: 'MessageCircle',
      translations: {
        create: [{ locale: 'zh', name: '留言板', description: '请先登录', tagline: '' }],
      },
    },
    update: {},
  })

  // 4. Series example
  const seriesEbpf = await db.series.upsert({
    where: { channelId_slug: { channelId: channelArticles.id, slug: 'ebpf-deep-dive' } },
    create: {
      channelId: channelArticles.id,
      slug: 'ebpf-deep-dive',
      translations: {
        create: [{ locale: 'zh', name: 'eBPF 深度漫游', description: '4 篇系列文章' }],
      },
    },
    update: {},
  })

  // 5. Entries (showcase 8 个，覆盖 7 个 EntryKind 各至少 1 个)
  const entries = [
    // ARTICLE × 2（其中 1 个 in series）
    {
      slug: 'why-i-rewrote-my-blog',
      channelId: channelArticles.id,
      kind: 'ARTICLE',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-20'),
      body: '# 为什么我重做了自己的博客\n\n这是一个关于不满足现成模板的过程...\n\n## 缘起\n\n## 选型\n\n## 实施',
      metadata: { cover: '/uploads/showcase/cover-1.jpg', readingMinutes: 8, toc: true },
      tagSlugs: ['design'],
      translations: { title: '为什么我重做了自己的博客', excerpt: '从 4 板块到 Channel/Entry 元模型的重构记录' },
    },
    {
      slug: 'ebpf-tracepoint-cheatsheet',
      channelId: channelArticles.id,
      kind: 'ARTICLE',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-15'),
      seriesId: seriesEbpf.id,
      seriesOrder: 1,
      body: '# eBPF tracepoint cheatsheet\n\n...',
      metadata: { cover: '/uploads/showcase/cover-2.jpg', readingMinutes: 12 },
      tagSlugs: ['systems', 'tooling'],
      translations: { title: 'eBPF tracepoint cheatsheet', excerpt: '系列第一篇：从 perf 到 bpftrace 的快速参考' },
    },
    // NOTE
    {
      slug: 'note-2026-05-23',
      channelId: channelStream.id,
      kind: 'NOTE',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-23'),
      body: '今天读到一段："好的工程师只解决一个问题，伟大的工程师解决一类问题。" 想了想，自己更想做的是后者。',
      metadata: { mood: 'focused' },
      tagSlugs: ['reading'],
      translations: { title: '关于解决一类问题', excerpt: '' },
    },
    // LINK
    {
      slug: 'link-postgres-locks',
      channelId: channelStream.id,
      kind: 'LINK',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-22'),
      body: 'Tim Bray 写的关于 PG 锁管理器的导读，非常实用。',
      metadata: {
        sourceUrl: 'https://www.tbray.org/ongoing/When/202x/2026/05/15/Postgres-Locks',
        sourceTitle: 'Reading Postgres Locks',
        sourceAuthor: 'Tim Bray',
        domain: 'tbray.org',
      },
      tagSlugs: ['systems'],
      translations: { title: 'Reading Postgres Locks', excerpt: 'Tim Bray 写的 PG 锁管理器导读' },
    },
    // JOKE
    {
      slug: 'joke-bom-prod',
      channelId: channelStream.id,
      kind: 'JOKE',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-21'),
      body: '> 同事：你昨天上的什么？\n> 我：一行 UTF-8 BOM。\n> 同事：。\n> （此后 prod 挂了 4 小时）',
      metadata: { category: 'tech' },
      tagSlugs: [],
      translations: { title: '一个 BOM 引发的血案', excerpt: '' },
    },
    // QUOTE
    {
      slug: 'quote-didion',
      channelId: channelStream.id,
      kind: 'QUOTE',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-19'),
      body: '"We tell ourselves stories in order to live."',
      metadata: { author: 'Joan Didion', source: 'The White Album', language: 'en' },
      tagSlugs: ['reading'],
      translations: { title: 'Joan Didion 的开篇', excerpt: '' },
    },
    // REVIEW
    {
      slug: 'review-slouching',
      channelId: channelArticles.id,
      kind: 'REVIEW',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-18'),
      body: '# Slouching Towards Bethlehem\n\n第一遍读完，Joan Didion 的句子像凿子...',
      metadata: {
        itemType: 'book',
        itemTitle: 'Slouching Towards Bethlehem',
        itemAuthor: 'Joan Didion',
        rating: 5,
        cover: '/uploads/showcase/slouching.jpg',
      },
      tagSlugs: ['reading'],
      translations: { title: 'Slouching Towards Bethlehem · 札记', excerpt: 'Joan Didion 1968 散文集的札记' },
    },
    // HOT_TAKE
    {
      slug: 'hot-take-2026-05-22',
      channelId: channelStream.id,
      kind: 'HOT_TAKE',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-22'),
      body: '热搜：某 AI 公司发布"通用模型 5.0"。\n\n我的观察：他们 demo 里所有失败案例都被精心避开了，明显是 picked。',
      metadata: {
        sourcePlatform: 'weibo',
        sourceUrl: 'https://weibo.com/...',
        sourceSnippet: '某 AI 公司发布"通用模型 5.0"',
        capturedAt: new Date('2026-05-22T10:00:00Z').toISOString(),
      },
      tagSlugs: ['tooling'],
      translations: { title: '关于"通用模型 5.0"的 demo', excerpt: '人工挑选的成功案例不算成功' },
    },
  ]

  for (const e of entries) {
    const created = await db.entry.upsert({
      where: { slug: e.slug },
      create: {
        slug: e.slug,
        channelId: e.channelId,
        kind: e.kind as never,
        status: e.status as never,
        publishedAt: e.publishedAt,
        body: e.body,
        metadata: e.metadata,
        seriesId: e.seriesId ?? null,
        seriesOrder: e.seriesOrder ?? null,
        authorId: admin.id,
        translations: {
          create: [{ locale: 'zh', title: e.translations.title, excerpt: e.translations.excerpt }],
        },
        tags: {
          create: e.tagSlugs.map((slug) => ({
            tag: { connect: { slug } },
          })),
        },
      },
      update: {},
    })
  }

  // 6. SiteConfig singleton
  await db.siteConfig.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      themeName: 'aurora',
      themeVars: {},
      metadata: {
        hero: {
          tagline: '在快的时代写慢一些的字',
          subtitle: 'Software · Security · Slow Blog',
          avatar: '/uploads/showcase/avatar.jpg',
          location: '杭州',
        },
        about: {
          body: '# About\n\nHaiDen / 工程师与业余写字人。在杭州，做一些慢的东西。',
          contact: {
            email: 'hello@blog.haiden.dev',
          },
        },
        trending: {
          weights: { view: 1.0, like: 3.0, comment: 5.0 },
          halfLifeHours: 72,
          recomputeIntervalHours: 1,
        },
        brand: {
          title: 'TZBlog',
          domain: 'blog.haiden.dev',
          description: '一个慢的个人技术博客',
        },
      },
    },
    update: {},
  })

  console.log('✅ Seed completed')
}

main()
  .catch((e) => {
    console.error('Seed failed', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
```

### 2.2 跑 seed

```bash
pnpm db:seed
```

---

## 3. 验证步骤

### 3.1 SQL 层验证

```sql
\dt   -- 列所有表
-- 期望：channels / entries / series / channel_translations / entry_translations /
--      series_translations / tags / tags_on_entries / entry_views / entry_likes /
--      comments / rate_limit_logs / page_views / media / site_config /
--      users / accounts / sessions / verification_tokens

-- 不期望：posts / columns / post_translations / column_translations /
--        tags_on_posts / post_views / post_likes

SELECT COUNT(*) FROM channels;     -- = 3
SELECT COUNT(*) FROM entries;      -- = 8
SELECT COUNT(*) FROM tags;         -- = 6
SELECT COUNT(*) FROM users WHERE role = 'ADMIN'; -- = 1
```

### 3.2 应用层验证

```bash
pnpm dev
# 浏览器访问：
# - http://localhost:3000/                  # 首页应显示 enabled channels
# - http://localhost:3000/c/articles        # CHRONICLE layout
# - http://localhost:3000/c/stream          # GREP layout
# - http://localhost:3000/posts/why-i-rewrote-my-blog  # Ink theme
# - http://localhost:3000/guestbook         # Login form (unauthed)
# - http://localhost:3000/admin             # Login redirect
```

### 3.3 测试层验证

```bash
pnpm test          # 全部测试 pass
pnpm typecheck     # 0 error
pnpm lint          # 0 warning
pnpm build         # success
```

如任一项失败 → 检查 cleanup 是否漏了某个旧 import / 旧 mock。

---

## 4. 回滚（开发期，破坏式 = 无回滚）

**官方立场**：开发期不需要回滚，重新 `prisma migrate reset --force` + `pnpm db:seed` 即可恢复 showcase。

如要保留旧数据，需在 Step 1.3 前手动 `pg_dump` 备份。

---

## 5. 一次性 checklist

- [ ] Step 1.1 备份现 schema
- [ ] Step 1.2 替换 schema 内容
- [ ] Step 1.3 销毁旧 migration（ha1den 确认）
- [ ] Step 1.4 重建 migration（人工审查 SQL）
- [ ] Step 1.5 执行 migrate reset
- [ ] Step 2.1 重写 `prisma/seed.ts`
- [ ] Step 2.2 跑 seed
- [ ] Step 3.1 SQL 层验证
- [ ] Step 3.2 应用层 smoke
- [ ] Step 3.3 测试层全绿
- [ ] 加 git tag `pre-blog-ia-redesign` 标记本次重构前的最后 commit

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:30:00Z -->
