# Spec — counter-fix (C)

> Capability: 修正 D3 R5 决策（commentCount 仅计 APPROVED）
> Stage: P1-C / §A
> SPEC-ID 前缀：`SPEC-C-F-`

## Domain rules

D3 R5 选了「commentCount 每次插入即 +1（含 PENDING）」，本 epic 决策 R6 改为「仅 APPROVED」：

- 新评论默认 status=PENDING，`commentCount` **不变**
- `status: PENDING → APPROVED`：`+1`
- `status: SPAM/REJECTED → APPROVED`：`+1`
- `status: APPROVED → 非-APPROVED`（含 PENDING）：`-1`
- 同 status 转换：不变
- 删除 APPROVED 评论：`-1`；删除非 APPROVED：不变

## Specs

### SPEC-C-F-1 — createComment 不再 commentCount +1

**GIVEN** post `hello` PUBLISHED, `Post.commentCount = 0`
**WHEN** `createComment({slug:"hello", ...})` 顶层评论被创建
**THEN** `Comment` 多 1 行 `status=PENDING`
**AND** `Post.commentCount` 仍为 `0`（修正 D3 R5）

### SPEC-C-F-2 — updateCommentStatus 流转 +/-

**GIVEN** post `hello` 下有 PENDING 评论 `c1`，`Post.commentCount = 0`

**WHEN** `updateCommentStatus(c1.id, "APPROVED", "user-admin")`
**THEN** `Comment` `c1.status = APPROVED`
**AND** `Post.commentCount = 1`（+1）

**WHEN** 接着 `updateCommentStatus(c1.id, "SPAM", "user-admin")`
**THEN** `c1.status = SPAM`
**AND** `Post.commentCount = 0`（-1）

**WHEN** 接着 `updateCommentStatus(c1.id, "REJECTED", "user-admin")`（同非-APPROVED 之间切换）
**THEN** `c1.status = REJECTED`
**AND** `Post.commentCount = 0`（不变）

**WHEN** 接着 `updateCommentStatus(c1.id, "APPROVED", "user-admin")`
**THEN** `c1.status = APPROVED`
**AND** `Post.commentCount = 1`（+1）

### SPEC-C-F-3 — deleteComment 计数器调整

**GIVEN** post `hello` 下有 APPROVED 评论 `c1`，`Post.commentCount = 1`
**WHEN** `deleteComment(c1.id)`
**THEN** `Comment` 行被删除
**AND** `Post.commentCount = 0`（-1）

**GIVEN** post `hello` 下还有 PENDING 评论 `c2`，`Post.commentCount = 0`
**WHEN** `deleteComment(c2.id)`
**THEN** `c2` 行被删除
**AND** `Post.commentCount = 0`（不变）
