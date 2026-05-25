# Spec 15 · Migration

> 破坏式数据迁移：drop 所有旧表（Post/Column/Comment 等）→ 新建 Channel/Entry/Series → reseed showcase。
>
> Reference: `proposal.md` D7 / `design-notes.md` A6 / `migration-plan.md` 完整步骤 / `schema-diff.md` Prisma diff

---

## Intent

把 TZBlog 从 `Post + Column` 元模型干净切到 `Channel + Entry + Series + RateLimitLog` 元模型。**开发期破坏式**：不保留旧数据、不保留旧 URL，依赖 `pnpm db:seed` 重建 showcase。

---

## Specs（spec-id 表）

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| mig-001 | dev db 含历史 Post/Column/Comment 数据 | 跑 `prisma migrate reset --force` + 新 schema | 旧表全部 dropped；新表全部 created；数据为空 |
| mig-002 | 干净的新 schema | 跑 `pnpm db:seed` | 创建至少 1 个 ADMIN user + 3 个 Channel（ARTICLES/STREAM/GUESTBOOK）+ 8 个 Entry（覆盖 ARTICLE/NOTE/LINK/JOKE/HOT_TAKE/QUOTE/REVIEW 至少各 1） |
| mig-003 | seeded db | 触发 `GET /api/admin/channels` | 返回 3 个 channel 按 order 排序 |
| mig-004 | seeded db with channel.kind=ARTICLES | 触发 `GET /posts/<seeded-article-slug>` | 返回 200 + 渲染 ARTICLE 详情 |
| mig-005 | seeded db with channel.kind=STREAM | 触发 `GET /c/<stream-channel-slug>` | 返回 200 + GREP layout 渲染 |
| mig-006 | seeded db with GUESTBOOK channel | 触发 `GET /guestbook`（未登录） | 返回 200 + 显示 magic link 登录表单 |
| mig-007 | seeded db | 跑 `prisma migrate status` | 报告 "Database schema is up to date" |
| mig-008 | seeded db | 在 `RateLimitLog` 表 insert 1 行 | 成功，COUNT(*) = 1 |
| mig-009 | seeded db | 删一个 Channel | 关联 Entries / EntryViews / EntryLikes / Comments 级联删除（验证 cascade）|
| mig-010 | seeded db | 触发 cron job `recomputeAllTrending` 一次 | 所有 published Entry 的 trendingScore 被更新；查询 `SELECT trending_score FROM entries WHERE status='PUBLISHED'` 至少有非 0 值 |

---

## Test File 映射

`prisma/migrations/__tests__/migration.test.ts`（Node integration，jsdom 不适用）

- 用 `vi.beforeAll` 跑真实 prisma migrate（against test db）
- 用 `vi.beforeEach` 跑 `pnpm db:seed`

---

## Acceptance（高层）

- [ ] `prisma migrate reset --force` 跑通且无 error
- [ ] `pnpm db:seed` 创造的 showcase 数据覆盖 7 个 EntryKind 至少各 1 个
- [ ] `pnpm db:seed` idempotent（重跑不报 unique constraint 错）
- [ ] 旧表 `posts/columns/post_translations/column_translations/tags_on_posts/comments/post_views/post_likes` 在 `\dt` 输出中**不存在**
- [ ] 新表 `channels/entries/series/channel_translations/entry_translations/series_translations/tags_on_entries/entry_views/entry_likes/rate_limit_logs` **存在**
- [ ] `Comment` 表保留（schema 更新含 `visibility/authorUserId` 字段）

---

## Don't（边界）

- 不做"双跑"：旧表 + 新表并存绝对禁止
- 不做"迁移工具"：不写脚本把旧 Post 转 ARTICLE Entry（开发期，不必要）
- 不做"URL 重定向表"：旧 `/columns` `/posts/[slug]` 等路径全废
- seed 文件**不**包含真实用户内容（避免泄露），用占位 lorem-ish 中文文案

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:30:00Z -->
