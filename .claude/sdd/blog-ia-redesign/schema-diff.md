# Schema Diff — Before / After

> 完整 Prisma schema diff，对应 `migration-plan.md` 的破坏式迁移步骤。
>
> **删除**：8 个 model + 1 个 enum
> **新增**：10 个 model + 4 个 enum
> **修改**：5 个现有 model 微调（User 加 role 选项 / Comment 加字段 / 等）

---

## Removed Models

| Model | 理由 |
|-------|------|
| `Post` | 被 `Entry` (kind=ARTICLE) 替代 |
| `PostTranslation` | 被 `EntryTranslation` 替代 |
| `Column` | 被 `Channel` (kind=ARTICLES) 替代 |
| `ColumnTranslation` | 被 `ChannelTranslation` 替代 |
| `TagsOnPosts` | 被 `TagsOnEntries` 替代 |
| `PostView` | 被 `EntryView` 替代 |
| `PostLike` | 被 `EntryLike` 替代 |

## Removed Enums

| Enum | 理由 |
|------|------|
| `PostStatus` | 被 `EntryStatus`（同三态 `DRAFT / PUBLISHED / ARCHIVED`） |

## Added Models

| Model | 用途 |
|-------|------|
| `Channel` | 频道元模型 |
| `ChannelTranslation` | 频道 i18n |
| `Entry` | 通用条目元模型 |
| `EntryTranslation` | 条目 i18n |
| `Series` | 系列（合集） |
| `SeriesTranslation` | 系列 i18n |
| `TagsOnEntries` | Tag m2m |
| `EntryView` | 浏览记录 |
| `EntryLike` | 点赞记录 |
| `RateLimitLog` | Magic link 频控 |

## Added Enums

| Enum | 值 |
|------|---|
| `ChannelKind` | `ARTICLES / NOTES / LINKS / STREAM / GUESTBOOK / CUSTOM` |
| `ChannelLayout` | `CHRONICLE / CARDS / TIMELINE / GREP / FEED` |
| `EntryKind` | `ARTICLE / NOTE / LINK / JOKE / HOT_TAKE / REVIEW / QUOTE / GUESTBOOK_THREAD` |
| `EntryStatus` | `DRAFT / PUBLISHED / ARCHIVED` |
| `CommentVisibility` | `PUBLIC / PRIVATE_TO_THREAD / DELETED` |

## Modified Models

### `User`

```diff
 model User {
   id        String   @id @default(cuid())
   email     String   @unique
   name      String
   avatar    String?
-  role      Role     @default(AUTHOR)
+  role      Role     @default(VISITOR)
   password  String?
   createdAt DateTime @default(now())

-  posts    Post[]
+  entries   Entry[]
+  comments  Comment[]
   accounts Account[]
   sessions Session[]
 }
```

`Role` 扩展：

```diff
 enum Role {
   ADMIN
   AUTHOR
+  VISITOR
 }
```

新 user 默认 `VISITOR`（magic link 注册），管理员手动升级为 `ADMIN`（或 seed 写死）。

### `Comment`

```diff
 model Comment {
   id            String              @id @default(cuid())
-  postId        String
+  entryId       String
   authorName    String
   authorEmail   String
   authorWebsite String?
+  authorUserId  String?             // 登录访客的 user id
   content       String              @db.Text
   status        CommentStatus       @default(PENDING)
+  visibility    CommentVisibility   @default(PUBLIC)
   visitorHash   String
   ipAddress     String
   userAgent     String
   parentId      String?
   reviewedBy    String?
   reviewedAt    DateTime?
   createdAt     DateTime            @default(now())

-  post    Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
+  entry   Entry     @relation(fields: [entryId], references: [id], onDelete: Cascade)
+  author  User?     @relation(fields: [authorUserId], references: [id])
   parent  Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
   replies Comment[] @relation("CommentReplies")

-  @@index([postId, status])
+  @@index([entryId, status])
   @@index([visitorHash, createdAt])
   @@index([status, createdAt])
+  @@index([entryId, visibility])
 }
```

### `Tag`

```diff
 model Tag {
   id   String @id @default(cuid())
   slug String @unique
   name String

-  posts TagsOnPosts[]
+  entries TagsOnEntries[]
 }
```

### `SiteConfig`

无 schema 变更（仍是 singleton + JSON metadata），但 `metadata` JSON 结构扩展（详见 `design-notes.md` A9）。

### `PageView` / `Media`

无变更。

### `Account / Session / VerificationToken`

无变更（Auth.js 标准 schema，magic link 通过 VerificationToken 实现）。

---

## 完整新 schema（codex 直接复制）

详见 `channel-meta-cms.md` §2.2 完整 Prisma 代码块（已对照命名约定 cuid + Translation + TagsOnX）。新增：

```prisma
model RateLimitLog {
  id        String   @id @default(cuid())
  scope     String   // "magic_link:email" / "magic_link:ip" / "magic_link:combo"
  key       String   // hashed
  createdAt DateTime @default(now())

  @@index([scope, key, createdAt])
}
```

---

## 索引策略对比

| 索引 | Before (Post) | After (Entry) |
|------|--------------|---------------|
| 状态 + 发布时间 desc | `@@index([status, publishedAt])` | `@@index([status, publishedAt(sort: Desc)])` 显式 desc |
| 频道筛选 | `@@index([columnId])` | `@@index([channelId, status, publishedAt(sort: Desc)])` 三列复合 |
| 作者筛选 | `@@index([authorId])` | `@@index([authorId])` |
| Kind 筛选 | — | `@@index([kind, status])` 新增 |
| 系列查询 | — | `@@index([seriesId, seriesOrder])` 新增 |
| Trending | — | `@@index([trendingScore(sort: Desc)])` 新增 |
| 浏览去重 | `@@unique([postId, visitorHash, dayKey])` | `@@unique([entryId, visitorHash, dayKey])` |
| 点赞唯一 | `@@unique([postId, visitorHash])` | `@@unique([entryId, visitorHash])` |

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:30:00Z -->
