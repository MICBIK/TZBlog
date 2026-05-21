# Spec — review-service (C)

> Capability: admin 端评论审核 service 函数
> Stage: P1-C / §B
> SPEC-ID 前缀：`SPEC-C-V-`

## Domain rules

- `listCommentsForAdmin(filter)`: 4 status 全状态可见（与前台 `listApprovedComments` 区分）
- 列表行附加 `post: { slug, title }` 方便 UI 跳转 + 展示
- 列表 q 搜：在 `authorName / content / authorEmail` 内 case-insensitive contains
- 默认排序：`createdAt desc`（最新优先，便于审核）
- `updateCommentStatus(id, status, reviewerId)`: 内部触发 §A counter-fix 的状态机调整
- 幂等（R7）：同 status 不抛错，仍写 `reviewedBy/reviewedAt`（标记"重审"）
- `reviewedBy` 接受任意 string（用户 id 或 "ai-{model}-{ver}"），由 caller 提供

## Specs

### SPEC-C-V-1 — listCommentsForAdmin 默认返全状态 + post 关联

**GIVEN** post `hello` 下有 PENDING/APPROVED/SPAM/REJECTED 各 1 条评论
**WHEN** `listCommentsForAdmin({ page: 1, pageSize: 20 })`
**THEN** 返回 `{items, total: 4, page: 1, pageSize: 20}`
**AND** 每个 item 含 `id / authorName / authorEmail / content / status / createdAt / reviewedBy / reviewedAt / parentId / post: { slug, title }`
**AND** 默认 `createdAt desc` 排序

### SPEC-C-V-2 — filter by status

**GIVEN** 同 V-1 数据
**WHEN** `listCommentsForAdmin({ status: "PENDING" })`
**THEN** 返回 `total: 1` + items 仅含 PENDING 评论

### SPEC-C-V-3 — filter by q (authorName / content / email)

**GIVEN** post `hello` 下有 3 条评论：authorName=Alice / Bob / Charlie，content 各异
**WHEN** `listCommentsForAdmin({ q: "alice" })`（小写）
**THEN** 返回包含 Alice 的评论（case-insensitive match）

**WHEN** `listCommentsForAdmin({ q: "ALICE" })`
**THEN** 也返回 Alice 的评论

### SPEC-C-V-4 — updateCommentStatus 写入 reviewer + at

**GIVEN** PENDING 评论 `c1`，`reviewedBy / reviewedAt = null`
**WHEN** `updateCommentStatus(c1.id, "APPROVED", "user-admin-id")`
**THEN** `c1.status = APPROVED`
**AND** `c1.reviewedBy = "user-admin-id"`
**AND** `c1.reviewedAt` ≈ now（5s 窗口）

### SPEC-C-V-5 — updateCommentStatus 幂等（R7）

**GIVEN** APPROVED 评论 `c1`（已被 reviewer 审过），`Post.commentCount = 1`
**WHEN** 再次 `updateCommentStatus(c1.id, "APPROVED", "user-admin-id")`
**THEN** 不抛错
**AND** `c1.status` 仍是 APPROVED
**AND** `Post.commentCount` 仍为 1（不重复 +1）
**AND** `c1.reviewedAt` 被刷新（重审标记）

### SPEC-C-V-6 — bulkUpdateCommentStatus 处理多个 ids（事务）

**GIVEN** 3 个 PENDING 评论 `c1 / c2 / c3`
**WHEN** `bulkUpdateCommentStatus([c1.id, c2.id, c3.id], "APPROVED", "user-admin-id")`
**THEN** 3 条都 status=APPROVED
**AND** 各自 `Post.commentCount` 各 +1（不同 post 时分别累加）
**AND** 全部 reviewedBy=user-admin-id

### SPEC-C-V-7 — deleteComment 真删 + cascade replies

**GIVEN** 顶层 APPROVED 评论 `c1` 下有 reply `c1r1`
**WHEN** `deleteComment(c1.id)`
**THEN** `c1` 与 `c1r1` 都被删除（Prisma `onDelete: NoAction` 关系，但应用层 cascade）
**AND** `Post.commentCount` 调整（按 §A SPEC-C-F-3 规则）

### SPEC-C-V-8 — NOT_FOUND on missing id

**GIVEN** 不存在 id="ghost"
**WHEN** `updateCommentStatus("ghost", "APPROVED", "user-admin")` 或 `deleteComment("ghost")`
**THEN** 抛 `AppError` `code === "NOT_FOUND"`
