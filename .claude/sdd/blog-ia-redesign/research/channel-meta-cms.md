# Channel / Entry 元模型设计参考

> 目标：把 TZBlog 从硬编码 `Post + Column` 模型升级到通用 `Channel + Entry` 元模型，承载文章、笔记、链接收藏、热点、笑话、书评、留言板等多形态条目。
>
> 强约束（防止滑成 Strapi）：不暴露 page builder、不做拖拽、layout 5-6 个预设封闭、metadata schema 在前端用 Zod discriminated union 强类型化、Channel 不嵌套、不做 view 系统。

---

## 1. 现有主流 CMS 元模型对比

### 1.1 Sanity.io — Document Type + Schema-as-Code (TS)

文档：https://www.sanity.io/docs/schema-types

Sanity 把 schema 当一等公民，定义在 `sanity.config.ts` 中作为 TS 模块。每个 `defineType` 等价于 PG 里的一个 collection；字段全部强类型，运行时同时被 Studio 和 Content Lake 使用。没有 "Builder UI"，schema 改动走代码 PR。这种范式是本设计的主要灵感来源——把 layout 和 kind 都做成枚举常量，编辑器 UI 自动跟着 schema 走，不开"自定义字段"。

```ts
// schemas/article.ts
import { defineType } from 'sanity'
export const article = defineType({
  name: 'article',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', validation: r => r.required() },
    { name: 'slug', type: 'slug', options: { source: 'title' } },
    { name: 'body', type: 'markdown' },
    { name: 'cover', type: 'image' },
  ],
})
```

### 1.2 Strapi — Content-Type Builder + Components + Dynamic Zone

文档：https://docs.strapi.io/cms/features/content-type-builder 与 https://docs.strapi.io/cms/features/dynamic-zones

Strapi 把"自定义内容类型"做成 Admin UI 里的图形 Builder：拖字段、选关系、生成 JSON schema 落 disk。`Components` 是可复用字段束，`Dynamic Zone` 允许编辑器从一组 Component 里任意拼组——本质是 page builder。这是 TZBlog **明确拒绝**的方向：会让"加一个 hot_take 频道"变成"用户在 admin 里手搓 schema"，跑题。

```json
{ "name": "page", "kind": "collectionType",
  "attributes": { "blocks": { "type": "dynamiczone",
    "components": ["hero", "richtext", "gallery"] } } }
```

### 1.3 Contentful — Content Model + Field Types

文档：https://www.contentful.com/developers/docs/concepts/data-model/

Contentful 的 Content Model 是云端配置，字段类型固定 12 种（Symbol/Text/Number/Boolean/Date/Location/Media/Reference/Array/JSON/Rich Text/Object）。比 Strapi 克制：没有 Dynamic Zone，但通过 `Reference` + `Array` 仍能拼很深的树。TZBlog 借鉴它的"字段类型封闭集合"思想，但**不**借鉴它的多 Reference 嵌套（评论 thread 永远不做）。

### 1.4 Payload CMS — Collections + Blocks

文档：https://payloadcms.com/docs/configuration/collections 与 https://payloadcms.com/docs/fields/blocks

Payload 把模型分成 `Collections`（≈ PG 表）和 `Globals`（单例）。它的 `Blocks` 字段是"用户能从 N 个预定义 Block 里挑一些拼成 body"——介于 Sanity 的 PortableText 和 Strapi 的 Dynamic Zone 之间。TZBlog 不引入 Blocks，但 Payload 的 **collection-as-TS-module** 模式是值得抄的：每个 collection 一个 `.ts` 文件，hooks/access/admin 字段就近声明。

### 1.5 Notion — Database = Page + Property + View

文档：https://developers.notion.com/docs/working-with-databases

Notion 的模型最激进：Database 就是一组 Page；每个 Page 有一组 Property（字段），同一 Database 可以挂多个 View（table/board/gallery/timeline/calendar），View 只是同一份数据的不同投影。这对 TZBlog 很有启发——layout 本质是 view，**但我们故意限制为 "1 Channel = 1 layout"** 以避免用户在前台切换视图带来的导航复杂度。Property 的"per-row schema"思路则被本设计内化为"per-kind metadata schema"。

### 1.6 Ghost — Posts + Pages + Tags（极简）

文档：https://ghost.org/docs/admin-api/

Ghost 的元模型只有三张表：`posts`、`pages`、`tags`，post 和 page 共表（通过 `type` 字段区分）。没有 channel/section 概念，分类只靠 tag。这是"对立面"参考——证明博客可以把模型砍到极简，但 TZBlog 要承载非文章形态（链接、笑话、热点），单 `posts` 表硬塞不下，所以走 Channel + Entry 而不是 Tag-only。

### 1.7 WordPress — Custom Post Type + Custom Fields + Block（Gutenberg）

文档：https://developer.wordpress.org/plugins/post-types/

WP 的 "Custom Post Type" (CPT) 是历史包袱里长出来的元模型：所有内容（post/page/attachment/CPT）共用 `wp_posts` 表，差异塞 `wp_postmeta` (EAV)。这是反面教材——EAV 查询惨、类型不安全。Gutenberg 又把 body 变成 block JSON，进一步把"内容"和"渲染"耦合。TZBlog 走相反路线：每个 kind 是枚举常量、metadata 是 JSONB 但 schema 在 Zod 里硬编码（不 EAV）。

### 1.8 Hashnode / Mirror.xyz — Publication + Article（无 channel 概念）

文档：https://apidocs.hashnode.com/

Hashnode/Mirror 这类"创作者博客 SaaS"模型最薄：一个 user 一个 `Publication`，下面只挂 `Article`/`Entry`。分类靠 tag 和 series（系列）。没有 Channel 概念，因为单作者博客通常**主题就 1-3 个**。这条经验提醒我们：Channel 抽象引入是为了"前台有多个并列的内容流"（文章 / 热点 / 留言板），不是为了"内容分类"——分类继续用 Tag。

### 1.9 对比小结表

| CMS | 模型自由度 | UI Builder | TZBlog 启发 |
|-----|----------|-----------|-----------|
| Sanity | 高（代码） | 无 | schema-as-code |
| Strapi | 极高 | 有（Dynamic Zone） | **反面**——拒绝 builder |
| Contentful | 中（云配置） | 有（克制） | 字段类型封闭 |
| Payload | 高（代码） | 部分（Blocks） | collection-as-module |
| Notion | 极高 | 是（View 切换） | per-kind metadata 思想 |
| Ghost | 极低 | 无 | 简单足够（但不够用） |
| WordPress | 高（EAV） | 是（Gutenberg） | **反面**——拒绝 EAV |
| Hashnode | 极低 | 无 | 单作者视角 |

**结论**：取 Sanity 的 schema-as-code + Notion 的 per-kind property + Hashnode 的单作者视角；显式拒绝 Strapi/WP 的 builder/EAV 路线。

---

## 2. TZBlog 元模型推荐

### 2.1 模型概览（ASCII）

```
SiteConfig (singleton)
   │
   ├── enabled channels (有序)
   ▼
Channel
   ├─ id, slug, order, enabled, icon, accentColor
   ├─ kind: ARTICLES | NOTES | LINKS | STREAM | GUESTBOOK | CUSTOM
   ├─ layout: CHRONICLE | CARDS | TIMELINE | GREP | FEED
   ├─ translations[] (name/description/tagline by locale)
   ├─ series[]
   └─ entries[]
              │
              ▼
        Entry
           ├─ id, slug, channelId, authorId, status, publishedAt
           ├─ kind: ARTICLE | NOTE | LINK | JOKE | HOT_TAKE | REVIEW | QUOTE | GUESTBOOK_THREAD
           ├─ body (Markdown)
           ├─ metadata (JSONB, Zod-typed by kind)
           ├─ seriesId?, seriesOrder?
           ├─ counters: viewCount/likeCount/commentCount/trendingScore
           ├─ translations[] (title/excerpt by locale)
           └─ tags[]
```

### 2.2 完整 Prisma schema 草案

> 命名沿用现有约定（cuid id、Translation 子表、TagsOnX 联结）。保留 `User/Account/Session/VerificationToken/PageView/SiteConfig/Media` 不动；删除 `Column/ColumnTranslation/Post/PostTranslation/TagsOnPosts/Comment/PostView/PostLike`，迁移到下面的新模型（迁移策略见 spec 15）。

```prisma
// =============================================================
// Enums
// =============================================================

enum ChannelKind {
  ARTICLES        // 长文（默认替代 Column）
  NOTES           // 短笔记 / 想法
  LINKS           // 外链收藏
  STREAM          // 杂记瀑布流
  GUESTBOOK       // 留言板专用
  CUSTOM          // 兜底（不鼓励，但允许过渡）
}

enum ChannelLayout {
  CHRONICLE
  CARDS
  TIMELINE
  GREP
  FEED
}

enum EntryKind {
  ARTICLE
  NOTE
  LINK
  JOKE
  HOT_TAKE
  REVIEW
  QUOTE
  GUESTBOOK_THREAD
}

enum EntryStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CommentVisibility {
  PUBLIC
  PRIVATE_TO_THREAD
  DELETED
}

// =============================================================
// Channel
// =============================================================

model Channel {
  id           String         @id @default(cuid())
  slug         String         @unique
  order        Int            @default(0)
  enabled      Boolean        @default(true)
  icon         String?        // lucide icon name 或 emoji
  accentColor  String?        // HSL token，例如 "var(--accent-aurora)"
  kind         ChannelKind
  layout       ChannelLayout
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  translations ChannelTranslation[]
  entries      Entry[]
  series       Series[]

  @@index([enabled, order])
  @@index([kind])
}

model ChannelTranslation {
  id          String  @id @default(cuid())
  channelId   String
  locale      String
  name        String
  description String?
  tagline     String?

  channel Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@unique([channelId, locale])
}

// =============================================================
// Series（合集，跨 Channel 但通常归属一个 Channel）
// =============================================================

model Series {
  id        String   @id @default(cuid())
  slug      String
  channelId String
  createdAt DateTime @default(now())

  channel      Channel              @relation(fields: [channelId], references: [id], onDelete: Cascade)
  translations SeriesTranslation[]
  entries      Entry[]

  @@unique([channelId, slug])
  @@index([channelId])
}

model SeriesTranslation {
  id          String  @id @default(cuid())
  seriesId    String
  locale      String
  name        String
  description String?

  series Series @relation(fields: [seriesId], references: [id], onDelete: Cascade)

  @@unique([seriesId, locale])
}

// =============================================================
// Entry
// =============================================================

model Entry {
  id             String       @id @default(cuid())
  slug           String       @unique
  channelId      String
  authorId       String
  kind           EntryKind
  status         EntryStatus  @default(DRAFT)
  publishedAt    DateTime?
  body           String       @db.Text           // Markdown 源
  metadata       Json         @default("{}")     // per-kind, Zod 验证
  seriesId       String?
  seriesOrder    Int?
  viewCount      Int          @default(0)
  likeCount      Int          @default(0)
  commentCount   Int          @default(0)
  trendingScore  Float        @default(0)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  channel      Channel             @relation(fields: [channelId], references: [id])
  author       User                @relation(fields: [authorId], references: [id])
  series       Series?             @relation(fields: [seriesId], references: [id])
  translations EntryTranslation[]
  tags         TagsOnEntries[]
  comments     Comment[]
  views        EntryView[]
  likes        EntryLike[]

  @@index([channelId, status, publishedAt(sort: Desc)])
  @@index([status, publishedAt(sort: Desc)])
  @@index([kind, status])
  @@index([authorId])
  @@index([seriesId, seriesOrder])
  @@index([trendingScore(sort: Desc)])
}

model EntryTranslation {
  id      String  @id @default(cuid())
  entryId String
  locale  String
  title   String
  excerpt String?

  entry Entry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, locale])
}

// =============================================================
// Tag
// =============================================================

model Tag {
  id   String @id @default(cuid())
  slug String @unique
  name String

  entries TagsOnEntries[]
}

model TagsOnEntries {
  entryId String
  tagId   String

  entry Entry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  tag   Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([entryId, tagId])
  @@index([tagId])
}

// =============================================================
// Comment（沿用旧规则，挂在 Entry 上而不是 Post，加 visibility 字段）
// =============================================================

model Comment {
  id            String              @id @default(cuid())
  entryId       String
  authorName    String
  authorEmail   String
  authorWebsite String?
  authorUserId  String?             // 登录用户的 userId（magic link 后填充）
  content       String              @db.Text
  status        CommentStatus       @default(PENDING)
  visibility    CommentVisibility   @default(PUBLIC)
  visitorHash   String
  ipAddress     String
  userAgent     String
  parentId      String?
  reviewedBy    String?
  reviewedAt    DateTime?
  createdAt     DateTime            @default(now())

  entry   Entry     @relation(fields: [entryId], references: [id], onDelete: Cascade)
  author  User?     @relation(fields: [authorUserId], references: [id])
  parent  Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  replies Comment[] @relation("CommentReplies")

  @@index([entryId, status])
  @@index([visitorHash, createdAt])
  @@index([status, createdAt])
  @@index([entryId, visibility])
}

// =============================================================
// EntryView / EntryLike（替代 PostView / PostLike）
// =============================================================

model EntryView {
  id          String   @id @default(cuid())
  entryId     String
  visitorHash String
  dayKey      String                 // YYYY-MM-DD UTC
  createdAt   DateTime @default(now())

  entry Entry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, visitorHash, dayKey])
  @@index([entryId, createdAt])
}

model EntryLike {
  id          String   @id @default(cuid())
  entryId     String
  visitorHash String
  createdAt   DateTime @default(now())

  entry Entry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@unique([entryId, visitorHash])
  @@index([entryId])
}
```

设计要点：

- `Entry.publishedAt` 加 `Desc` 索引：所有列表查询都按时间倒序，避免 sort 时回表。
- `trendingScore` 单独索引：首页"近期热门"用得上，离线 job 写回。
- `metadata: Json` 是唯一允许"软结构"的字段；Zod 在前后端做 schema 守门。
- `seriesId + seriesOrder`：合集按顺序，少数 entry 进 series（大部分为 NULL）。
- 删除 `Post.cover`：cover 改进 `metadata.cover`（仅 ARTICLE/REVIEW kind 有）。
- Channel **不嵌套** Channel：没有 parentId，强约束 IA 平铺。
- `Comment.authorUserId` 新增：留言板登录用户的 userId 引用。
- `Comment.visibility` 新增：PUBLIC（普通文章评论）/ PRIVATE_TO_THREAD（Guestbook thread 内仅 author+admin 可见）/ DELETED。

---

## 3. metadata JSONB per-kind Zod schema

> 位置：`src/lib/schemas/entryMetadata.ts`。前端 form 用 `zodResolver`，后端 API 入口 `EntryMetadataSchema.parse(metadata)`，跨层共享。

```typescript
// src/lib/schemas/entryMetadata.ts
import { z } from 'zod'

// ---- per-kind schemas ----------------------------------------

export const articleMetadataSchema = z.object({
  cover: z.string().url().optional(),
  readingMinutes: z.number().int().positive().optional(),
  toc: z.boolean().default(true),
  ogImage: z.string().url().optional(),
})

export const noteMetadataSchema = z.object({
  pinned: z.boolean().default(false),
  mood: z.enum(['curious', 'focused', 'frustrated', 'celebratory']).optional(),
})

export const linkMetadataSchema = z.object({
  sourceUrl: z.string().url(),
  sourceTitle: z.string().min(1),
  sourceAuthor: z.string().optional(),
  thumbnail: z.string().url().optional(),
  domain: z.string().optional(),
})

export const jokeMetadataSchema = z.object({
  category: z.enum(['tech', 'life', 'absurd']).default('absurd'),
  punchlineHidden: z.boolean().default(false),
})

export const hotTakeMetadataSchema = z.object({
  sourcePlatform: z.enum(['weibo', 'twitter', 'aihot', 'hackernews', 'v2ex', 'zhihu']),
  sourceUrl: z.string().url(),
  sourceSnippet: z.string().min(1),
  capturedAt: z.string().datetime().optional(),
  aiCommentary: z.string().optional(), // V2 backlog
})

export const reviewMetadataSchema = z.object({
  itemType: z.enum(['book', 'movie', 'tool', 'paper', 'product']),
  itemTitle: z.string().min(1),
  itemAuthor: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  externalUrl: z.string().url().optional(),
  cover: z.string().url().optional(),
})

export const quoteMetadataSchema = z.object({
  author: z.string().min(1),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  language: z.string().optional(),
})

export const guestbookThreadMetadataSchema = z.object({
  visibility: z
    .enum(['PRIVATE_TO_AUTHOR', 'PUBLIC'])
    .default('PRIVATE_TO_AUTHOR'),
  visitorName: z.string().min(1).max(40),
  visitorEmail: z.string().email().optional(),
})

// ---- discriminated union -------------------------------------

export const entryMetadataSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ARTICLE'), data: articleMetadataSchema }),
  z.object({ kind: z.literal('NOTE'), data: noteMetadataSchema }),
  z.object({ kind: z.literal('LINK'), data: linkMetadataSchema }),
  z.object({ kind: z.literal('JOKE'), data: jokeMetadataSchema }),
  z.object({ kind: z.literal('HOT_TAKE'), data: hotTakeMetadataSchema }),
  z.object({ kind: z.literal('REVIEW'), data: reviewMetadataSchema }),
  z.object({ kind: z.literal('QUOTE'), data: quoteMetadataSchema }),
  z.object({
    kind: z.literal('GUESTBOOK_THREAD'),
    data: guestbookThreadMetadataSchema,
  }),
])

export type EntryMetadata = z.infer<typeof entryMetadataSchema>

// ---- helper: parse from DB row -------------------------------

export function parseEntryMetadata(
  kind: EntryMetadata['kind'],
  raw: unknown,
): EntryMetadata {
  return entryMetadataSchema.parse({ kind, data: raw })
}
```

存储约定：DB 里 `Entry.metadata` 只存 `data` 部分（`kind` 已在 `Entry.kind` 列上，避免冗余）。读出来时调 `parseEntryMetadata(entry.kind, entry.metadata)` 还原 discriminated union。

---

## 4. Channel Layout 详细定义

> 共 5 个 layout 预设，封闭枚举。每个 layout 是一个 React server component。**不**支持 admin 新增 layout。

### 4.1 CHRONICLE

- **适用 kind**：`ARTICLES`（次选 `REVIEWS`）
- **视觉**：单列长文流，每条卡片含 cover + title + excerpt + meta（作者/时间/阅读分钟），强烈的衬线字体（Ink 皮）。
- **必需字段**：`title`、`excerpt`、`publishedAt`、`metadata.cover`（可选但强烈推荐）、`metadata.readingMinutes`。
- **示例文件**：`src/components/channel-layouts/ChronicleLayout.tsx`

### 4.2 CARDS

- **适用 kind**：`ARTICLES`、`REVIEWS`、`CUSTOM`
- **视觉**：响应式 12 列网格，桌面 3 列 / 平板 2 列 / 手机 1 列；卡片高度自适应，hover 上浮 + accent 描边。
- **必需字段**：`title`、`excerpt`、`metadata.cover` 或 `metadata.thumbnail`、`publishedAt`。

### 4.3 TIMELINE

- **适用 kind**：`NOTES`、`JOKES`、`QUOTE`
- **视觉**：竖直时间轴，左侧时间刻度线 + 圆点，右侧 entry 内容；同日条目聚合，跨日有日期 header。
- **必需字段**：`title` 或 `body` 首句、`publishedAt`、可选 `metadata.mood`。

### 4.4 GREP

- **适用 kind**：`LINKS`、`STREAM`
- **视觉**：单色等宽表格 + 顶部固定搜索框，输入实时高亮匹配行（client-side filter）；列：`#`、`time`、`title`、`source`、`tags`。
- **必需字段**：`title`、`publishedAt`、`metadata.sourceUrl` 或 `metadata.sourcePlatform`、`tags[]`。

### 4.5 FEED

- **适用 kind**：`STREAM`（次选 `NOTES` 大量混排）
- **视觉**：Masonry 瀑布流（CSS columns），无固定卡片高度；可混入图片、引用块、链接预览。无限滚动。
- **必需字段**：`body`（短，<280 字符为佳）、`publishedAt`、可选 `metadata.cover`。

### 4.6 Layout × Kind 推荐矩阵

| Layout    | ARTICLES | NOTES | LINKS | STREAM | GUESTBOOK | REVIEW | QUOTE | JOKE |
|-----------|:--------:|:-----:|:-----:|:------:|:---------:|:------:|:-----:|:----:|
| CHRONICLE |   yes    |       |       |        |           |  opt   |       |      |
| CARDS     |   yes    |       |       |        |           |  yes   |       |      |
| TIMELINE  |          |  yes  |       |        |           |        |  yes  |  yes |
| GREP      |          |       |  yes  |  yes   |           |        |       |      |
| FEED      |          |  opt  |       |  yes   |           |        |  opt  |  opt |

GUESTBOOK 走专用页（`/guestbook`），不挂 layout。

---

## 5. URL 结构推荐

| 路径 | 含义 | 备注 |
|------|------|------|
| `/` | 首页 | 动态渲染所有 `enabled` channel 的预览块 |
| `/c/<channel-slug>` | Channel 详情 | 按 `Channel.layout` 渲染 entry 列表 |
| `/c/<channel-slug>/<entry-slug>` | Entry 详情（通用） | 适用所有 kind |
| `/posts/<entry-slug>` | 文章详情（保留 SEO 友好路径） | **仅当 entry.kind = ARTICLE 才路由命中**，否则 404 |
| `/c/<channel-slug>/series/<series-slug>` | Series 详情 | 按 `seriesOrder` 排序展示 |
| `/guestbook` | 留言板 | 特殊路由，不通过 `/c/`，跳过 GUESTBOOK kind 的 channel slug |
| `/tags/<tag-slug>` | Tag 详情 | 跨 channel 聚合所有同 tag 的 entry |
| `/admin/channels` | 后台 Channel 列表 | |
| `/admin/channels/<id>/edit` | Channel 编辑 | |
| `/admin/entries` | 后台 Entry 列表（可筛 channel/kind） | |
| `/admin/entries/<id>/edit` | Entry 编辑 | |

设计要点：

- `/posts/<entry-slug>` 是 SEO 友好别名，**只对 ARTICLE 生效**。Server component 里 `if (entry.kind !== 'ARTICLE') notFound()`。
- `/c/<channel-slug>/<entry-slug>` 是通用路径，所有 kind 都能命中（包括 ARTICLE 也可以通过这个路径访问，做 301 → `/posts/...`）。
- `/guestbook` 显式特例：把"留言板"当一等公民页面，不让用户从 `/c/guestbook` 进入，避免暴露内部 kind 名称。

---

## 6. 反过度抽象原则（Don't 清单）

- 不要做 page builder：不允许 admin 拼组 block 渲染页面。Layout 是代码。
- 不要让 admin 自定义新 layout：5 个枚举值是终态。新增 layout = 提 PR + 写组件 + 加 enum。
- 不要让 admin 自定义新 entry kind：8 个枚举值是终态。要新 kind = 提 PR。
- 不要让 metadata 字段动态可配：metadata 字段集必须在 `entryMetadata.ts` 里硬编码。后台编辑器根据 `entry.kind` 渲染对应 Zod schema 的固定表单。
- 不要让 Channel 套 Channel：没有 `parentId`，IA 强制平铺。如果将来要"二级分类"——用 Tag。
- 不要做 view 系统：一个 Channel 一种 layout。不在前台暴露"切换视图"。
- 不要做 workflow：`DRAFT / PUBLISHED / ARCHIVED` 三态够了，不引入 `REVIEW / SCHEDULED / PRIVATE` 等中间态。
- 不要做权限矩阵：单作者（ADMIN/AUTHOR）+ 留言板访客（magic link）两类身份，不引入 role-based 字段级权限。
- 不要做 i18n field 级 fallback chain：locale 命不中就显示默认 locale。
- 不要把评论做成 tree（>2 层）：现在是 `parentId` 自引用一层；不做无限嵌套渲染。

---

## 7. 后续扩展方向（V2+ 不在本次范围）

| 方向 | 阶段 | 备注 |
|------|------|------|
| AI 自动生成 hot_take entry | V2 | 离线 job 抓 weibo/twitter/aihot → 生成 HOT_TAKE 草稿入 DRAFT，作者审 |
| metadata.aiCommentary 渲染 | V2 | 编辑器加 AI 评论按钮 |
| 多语言 Entry | V3 | EntryTranslation 已就位，加 i18n 路由 + middleware |
| Entry RSS / Atom 输出 | V2 | per-channel + global |
| Webmention / Trackback | V3 | 接 IndieWeb 生态 |
| Entry 跨 Channel 引用 | V3 | 引入 `EntryReference` 表，谨慎 |
| Trending 计算迁移到 Edge job | V2 | 现在内嵌字段 + cron |
| 评论 thread tree（>2 层） | **永不** | 反垃圾 + 阅读体验不值 |
| 多作者 / 用户社区 | **永不** | 单作者博客定位 |
| Admin layout 自定义 | **永不** | 反 Strapi 滑坡 |

---

## 8. Channel 增删改后台 UX

### 8.1 列表页 `/admin/channels`

```
+--------------------------------------------------------------+
| Channels                                  [+ New Channel]    |
+--------------------------------------------------------------+
| Order | Slug      | Kind     | Layout    | Theme    | #  | ✓ |
+-------+-----------+----------+-----------+----------+----+---+
|  up/dn| articles  | ARTICLES | CHRONICLE | INK      | 42 | • |
|  up/dn| notes     | NOTES    | TIMELINE  | AURORA   | 17 | • |
|  up/dn| stream    | STREAM   | GREP      | TERMINAL | 88 | • |
|  up/dn| guestbook | GUESTBOOK| —         | AURORA   |  3 | o |
+--------------------------------------------------------------+
```

- 列：order / slug / kind / layout / theme / entry count / enabled toggle
- 排序：上下移动按钮（不做拖拽，按需触发 server action 改 `order`）
- 行点击 → 跳 `/admin/channels/<id>/edit`

### 8.2 新建/编辑表单（关键步骤联动）

```
Step 1: Slug & Kind
  - slug：[__________] (kebab-case, unique)
  - kind：( ) ARTICLES (•) NOTES ( ) LINKS ( ) STREAM ( ) GUESTBOOK ( ) CUSTOM

Step 2: Layout（根据 kind 过滤可选项）
  - 选 NOTES → 只显示 TIMELINE / FEED
  - 选 LINKS → 只显示 GREP / CARDS
  - 选 ARTICLES → 显示 CHRONICLE / CARDS

Step 3: Theme & Accent（theme 字段不显式存，由 routing 推论；admin 只配 accentColor）
  - accentColor：[var(--accent-aurora) ▼]
  - icon：[输入 lucide name 或 emoji]

Step 4: Translations
  - 仅 "zh" 一行（MVP）
  - name / description / tagline

Step 5: Visibility
  - enabled：[●] ON
  - order：[3]（自动取末位 + 1）
```

- Kind 与 Layout 联动用 `<Select>` 的受控 onChange 过滤。
- 提交走 server action，前后端共用 `channelInputSchema`（Zod）。

### 8.3 删除策略

- **开发期**：硬删除 + 级联（删除 Channel → 删除 ChannelTranslation + Series + Entries + ...）。配合 `db:seed` 重置数据。
- **生产期**：改为 **enabled flag toggle**——加 `archivedAt: DateTime?` 字段，列表过滤 `archivedAt: null`，避免误删丢内容。
- 过渡：MVP 阶段先硬删除，feature complete 后第一次 prod deploy 前的 migration 加 `archivedAt`。

### 8.4 Entry 编辑器中 Channel/Kind 联动

- 选 Channel → 自动从 `channel.kind` 推断 entry.kind 候选集（例如 NOTES channel 只能创建 NOTE/QUOTE/JOKE）。
- 选 Kind → 渲染对应 `metadata` 字段表单（用 `entryMetadata.ts` 里的 Zod schema 驱动）。
- 强制约束：Channel.kind = GUESTBOOK 的 channel **不允许**在后台创建 Entry（GUESTBOOK_THREAD 由 `/guestbook` 前台 magic link 流程触发）。

---

## 9. 决策回顾

1. **保留 Markdown 源**：`Entry.body` 是 Markdown 字符串，不是 JSON AST。沿用 5/24 已经接入的 BlockNote 0.51.2 + `markdownBridge.ts`（详见 `editor-comparison.md`）。
2. **metadata = JSONB + Zod，不是 EAV**：DB 灵活、应用层强类型，避免 WordPress 的 postmeta 陷阱。
3. **Channel 平铺、无嵌套**：用 Tag 做交叉，不用 sub-channel。
4. **Layout 5 个、Kind 8 个，全部 enum**：枚举值变动 = 代码 PR，杜绝 admin builder。
5. **`/posts/<slug>` 路径保留**：SEO 不能破，迁移期通过 `kind=ARTICLE` 守门。
6. **Channel.theme 字段不存在**：theme 由路由级硬映射推论（详见 `design-notes.md` Q10/A4 + `theme-token-strategy.md`）。

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T12:00:00Z -->
