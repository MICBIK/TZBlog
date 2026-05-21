# test-map.md — admin-comments-review

> spec-id → 测试函数 + 文件路径 + 层级
> 涉及 Server Action / API 的 spec 必须有 zod schema 校验测试（CLAUDE.md TDD 铁律 #2）

## schema-migration

| spec-id | 测试 / 验证 | 文件 | 层级 |
|---|---|---|---|
| SPEC-C-S-1 | `prisma migrate dev` 跑过 + `pnpm typecheck` 通过（Comment.reviewedBy/reviewedAt 类型可见） | shell-level | manual |
| SPEC-C-S-2 | `comments.test.ts` 现有 6/6 spec 仍 PASS | `src/lib/services/comments.test.ts` | integration（已存在，回归） |

> S 段只是 schema 改动 + migration，无独立测试函数；通过现有 service 测试不回归证明 §0 完整。

## counter-fix

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-C-F-1 | `createComment does not increment commentCount (修正 D3 R5)` | `src/lib/services/comments.test.ts` | integration（**改 D3 现有断言**） |
| SPEC-C-F-2 | `updateCommentStatus adjusts commentCount on transitions` | `src/lib/services/comments.test.ts` | integration |
| SPEC-C-F-3 | `deleteComment decrements commentCount when status was APPROVED` | `src/lib/services/comments.test.ts` | integration |

> §A 同时含修改 D3 6 个 service 测试中 commentCount 期望值。这是 R5 决策修正的 collateral，不算 TDD 违规。

## review-service

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-C-V-1 | `listCommentsForAdmin returns all 4 statuses with post join + pagination meta` | `src/lib/services/comments.test.ts` | integration |
| SPEC-C-V-2 | `listCommentsForAdmin filter by status` | `src/lib/services/comments.test.ts` | integration |
| SPEC-C-V-3 | `listCommentsForAdmin filter by q (case-insensitive)` | `src/lib/services/comments.test.ts` | integration |
| SPEC-C-V-4 | `updateCommentStatus writes reviewedBy + reviewedAt` | `src/lib/services/comments.test.ts` | integration |
| SPEC-C-V-5 | `updateCommentStatus is idempotent on same status (R7)` | `src/lib/services/comments.test.ts` | integration |
| SPEC-C-V-6 | `bulkUpdateCommentStatus updates many in transaction` | `src/lib/services/comments.test.ts` | integration |
| SPEC-C-V-7 | `deleteComment cascades replies` | `src/lib/services/comments.test.ts` | integration |
| SPEC-C-V-8 | `updateCommentStatus / deleteComment throw NOT_FOUND on missing id` | `src/lib/services/comments.test.ts` | integration |

## review-api

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-C-A-1 | `GET /api/admin/comments lists by status filter` | `src/app/api/admin/comments/route.test.ts` | integration |
| SPEC-C-A-2 | `PATCH /api/admin/comments/[id] updates status + reviewedBy` | `src/app/api/admin/comments/[id]/route.test.ts` | integration |
| SPEC-C-A-3 | `DELETE /api/admin/comments/[id] removes row` | `src/app/api/admin/comments/[id]/route.test.ts` | integration |
| SPEC-C-A-4 | `POST /api/admin/comments/bulk updates multiple` | `src/app/api/admin/comments/bulk/route.test.ts` | integration |
| SPEC-C-A-5 | `401 on unauthenticated requests` | 各 route.test.ts | integration |

> zod schema 校验：`commentStatusUpdateSchema` 与 `commentBulkUpdateSchema` 与现有 `commentFilterSchema` 在 `src/lib/schemas/comment.test.ts` 已有/追加（边界用例覆盖 invalid status / empty ids / page bounds）

## review-ui

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-C-U-1 | `<CommentsAdminPage /> 4 tabs + counts + URL sync`（page 测试通过 mock service 完成） | `src/app/(admin)/admin/comments/page.test.tsx` | jsdom |
| SPEC-C-U-2 | `<CommentsTable /> renders rows + inline approve/spam/reject/delete actions + optimistic update + rollback` | `src/components/admin/comments/CommentsTable.test.tsx` | jsdom |
| SPEC-C-U-3 | `<CommentsTable /> multi-select toggles BulkActions; bulk approve triggers POST /bulk` | `src/components/admin/comments/CommentsTable.test.tsx` | jsdom |
| SPEC-C-U-4 | `<AdminSidebar /> includes 评论管理 link to /admin/comments` | `src/components/admin/AdminSidebar.test.tsx` | jsdom |

## helper / shared

| 项 | 文件 |
|---|---|
| zod schema 测试 | `src/lib/schemas/comment.test.ts` 追加 commentFilterSchema + commentStatusUpdateSchema + commentBulkUpdateSchema 用例 |

## 备注

- integration 用 dev Postgres (port 5433) + `tests/helpers/db.ts`
- API 测试 mock `@/lib/auth` 注入 session（参考 `src/app/api/admin/posts/route.test.ts`）
- jsdom 测试 mock `fetch` + `next/navigation` + `sonner`
- 不引入新依赖
