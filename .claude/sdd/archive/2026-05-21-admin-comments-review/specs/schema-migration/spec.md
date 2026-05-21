# Spec — schema-migration (C)

> Capability: Prisma `Comment` 表加 `reviewedBy String? + reviewedAt DateTime?`
> Stage: P1-C / §0 prerequisite
> SPEC-ID 前缀：`SPEC-C-S-`

## Domain rules

- 字段为审核流转留 audit trail
- `reviewedBy` 是 String 而非 FK，原因：未来 AI 审核接入时可填 `"ai-{model}-{version}"`，与 user.id 共存
- `reviewedAt` 由 service 层在改 status 时主动写
- 旧数据 migration 后自然为 `null`（PENDING 未审 / 历史 APPROVED 无 audit）

## Specs

### SPEC-C-S-1 — Comment 表新增字段

**GIVEN** Prisma schema 的 `Comment` model 当前没有 `reviewedBy` 与 `reviewedAt` 字段
**WHEN** 执行 `prisma migrate dev --name add_comment_review_fields`
**THEN** `Comment` 表多出两列：
  - `reviewedBy VARCHAR? NULL`
  - `reviewedAt TIMESTAMP? NULL`
**AND** 已有评论数据这两列填 `NULL`
**AND** `npx prisma generate` 后 TypeScript 类型 `Comment.reviewedBy: string | null` 与 `Comment.reviewedAt: Date | null` 可用

### SPEC-C-S-2 — schema-migration 不破坏现有 PENDING 流入

**GIVEN** D3 已落地，`createComment` 可正常插入 PENDING
**WHEN** migration 完成后再次跑 `pnpm test src/lib/services/comments.test.ts`
**THEN** 现有 6 个 spec 仍 PASS（无回归）
**AND** 数据库表内 `Comment` 行多出 2 个 null 列，不影响 service 逻辑
