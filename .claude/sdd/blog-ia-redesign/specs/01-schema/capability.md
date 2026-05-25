# Spec 01 · Schema

> Channel / Entry / Series 元模型 Prisma schema 落地。
>
> Reference: `channel-meta-cms.md` §2.2 / `schema-diff.md` / `magic-link-auth.md` §3.2

---

## Intent

把 Prisma schema 完整重写为 Channel/Entry/Series + RateLimitLog 元模型，删除 Post/Column 模型，保留 User/Account/Session/VerificationToken/PageView/SiteConfig/Media。

---

## Specs

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| schema-001 | 新 schema | 跑 `pnpm prisma generate` | 生成的 `@prisma/client` 含 `Channel / Entry / Series / RateLimitLog` types |
| schema-002 | 新 schema | 跑 `pnpm typecheck` | 0 error，所有依赖 `Post`/`Column` 的 TS code 已迁移 |
| schema-003 | 新 schema + 1 Channel + 1 Entry | 查询 `db.entry.findFirst({ include: { channel: true, tags: true, translations: true } })` | 返回正确嵌套结构 |
| schema-004 | 新 schema | INSERT `Entry { kind: 'ARTICLE', metadata: { cover: 'x', readingMinutes: 5 } }` | 成功，metadata JSONB 存对应字段 |
| schema-005 | 新 schema | INSERT `Channel { kind: 'GUESTBOOK', layout: 'FEED' }` 且 INSERT `Entry { channelId: 该, kind: 'GUESTBOOK_THREAD' }` | 成功（验证 enum 联动允许） |
| schema-006 | 新 schema | DELETE channel 一条 | 关联 entries / translations / series 级联 deleted |
| schema-007 | 新 schema | 创建 2 Series + 4 Entry（其中 2 个属于一个 Series） | seriesId/seriesOrder 索引可查询 |
| schema-008 | 新 schema | UPDATE Entry.trendingScore = 99.5 | 索引 `trendingScore desc` 排序正确 |
| schema-009 | 新 schema | INSERT 同 entryId + visitorHash + dayKey EntryView | 第二次 INSERT 触发 unique constraint error |
| schema-010 | 新 schema | INSERT Comment with visibility='PRIVATE_TO_THREAD' + authorUserId | 成功 |

---

## Test File

`prisma/__tests__/schema.test.ts`（Node integration，test db）

---

## Acceptance

- [ ] Prisma schema 替换完成
- [ ] `pnpm prisma generate` 无 error
- [ ] `pnpm prisma migrate dev --name init-channel-entry-meta-model` 成功
- [ ] `pnpm db:seed` 创造完整 showcase
- [ ] schema-001 ~ schema-010 全部 pass

---

## Don't

- 不引入 EAV 模式
- 不嵌套 Channel
- 不为 metadata 字段动态可配
- 不加 enum 之外的 kind/layout 值

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:35:00Z -->
