# tasks.md — admin-comments-review

> 微循环结构：1 spec scenario = 1 微循环（`.a [TEST-RED]` + `.b [IMPL-GREEN]`）
> 阶段前缀 `[P1-C]`
> commit scope 约定：`comments-schema` / `counter-fix` / `comments-admin-service` / `comments-admin-api` / `comments-admin-ui` / `admin-sidebar`

## §0 准备

- [ ] §0.1 SDD 五件套（proposal + 5×spec + test-map + tasks）一次性建好提交 — `docs(sdd): admin-comments-review scaffold [no-tdd]`
- [ ] §0.2 schema migration（**ha1den 确认后再跑**）
  - 改 `prisma/schema.prisma`：`Comment` 加 `reviewedBy String?` + `reviewedAt DateTime?`
  - 跑 `pnpm db:migrate` (会触发 `prisma migrate dev`)，名为 `add_comment_review_fields`
  - 跑 `pnpm typecheck` 确认 Comment 类型增量字段可见
  - 跑 `pnpm test src/lib/services/comments.test.ts` 确认现有 6 spec 不回归
  - commit `feat(comments-schema): add reviewedBy + reviewedAt [no-tdd]`

## §A [P1-C] counter-fix (修正 D3 R5)

> 注意：本节同时修改 D3 已写的 service 测试（SPEC-D3-C-1 顶层评论 commentCount 期望从 1 改 0；SPEC-D3-C-2 reply 期望从 1 改 0；SPEC-D3-C-3 reply-of-reply 失败 commentCount 期望维持 0）。这是 R5 决策修正的 collateral，不算 TDD 违规。

### A.1 [SPEC-C-F-1] createComment 不再 +1

- [ ] A.1.a [TEST-RED] 改现有 `createComment top-level inserts PENDING + commentCount +1` 测试 → 改成 `commentCount 仍为 0`；同时改 reply 测试（C-2）的 commentCount 期望；跑测试粘 FAIL
- [ ] A.1.b [IMPL-GREEN] 删 `createComment` 内 `tx.post.update({...commentCount increment})` 行；粘 PASS

### A.2 [SPEC-C-F-2] updateCommentStatus 流转 +/-

- [ ] A.2.a [TEST-RED] 写 `updateCommentStatus adjusts commentCount on transitions` 集成测试（4 个流转步骤断言计数器）；粘 FAIL
- [ ] A.2.b [IMPL-GREEN] 新增 `updateCommentStatus(id, status, reviewerId)`：先取 current.status，判断流转方向，事务内更新 + 计数器调整 + 写 reviewedBy/reviewedAt；粘 PASS

### A.3 [SPEC-C-F-3] deleteComment 计数器调整

- [ ] A.3.a [TEST-RED] 写 `deleteComment decrements commentCount when status was APPROVED` + `... is no-op when status was non-APPROVED` 测试粘 FAIL
- [ ] A.3.b [IMPL-GREEN] 新增 `deleteComment(id)`：事务内读 current.status + delete，APPROVED 时 post.commentCount -1；粘 PASS

## §B [P1-C] review-service

### B.1 [SPEC-C-V-1..3] listCommentsForAdmin

- [ ] B.1.a [TEST-RED] 写 `listCommentsForAdmin returns all 4 statuses with post join` + `filter by status` + `filter by q (case-insensitive)` 三个 case 粘 FAIL
- [ ] B.1.b [IMPL-GREEN] 新增 `listCommentsForAdmin(filter)`：findMany WHERE { status?, q?在 authorName/content/authorEmail contains insensitive } + include post (slug + title)，分页；粘 PASS

### B.2 [SPEC-C-V-4..5] updateCommentStatus reviewer + 幂等

- [ ] B.2.a [TEST-RED] 写 `updateCommentStatus writes reviewedBy + reviewedAt` + `is idempotent on same status (R7)` 粘 FAIL
- [ ] B.2.b [IMPL-GREEN] §A.2.b 实现已含 reviewer 写入；幂等行为通过事务内"原 status == new status 时跳过计数器但仍写 reviewer 时间戳"；粘 PASS

### B.3 [SPEC-C-V-6] bulkUpdateCommentStatus

- [ ] B.3.a [TEST-RED] 写 `bulkUpdateCommentStatus updates many in transaction` 粘 FAIL
- [ ] B.3.b [IMPL-GREEN] 新增 `bulkUpdateCommentStatus(ids, status, reviewerId)`：事务内 loop 调 single update（复用 A.2 逻辑），返回 `{ updated: N }`；粘 PASS

### B.4 [SPEC-C-V-7] deleteComment cascade replies

- [ ] B.4.a [TEST-RED] 写 `deleteComment cascades replies (顶层 c1 含 reply c1r1 → 删除 c1 后两条都消失)` 粘 FAIL
- [ ] B.4.b [IMPL-GREEN] §A.3.b 已删 deleteComment 主体；本节加 cascade 处理：因 Prisma 的 `parent: NoAction`，需先手动 deleteMany replies，再 delete top；事务内完成；粘 PASS

### B.5 [SPEC-C-V-8] NOT_FOUND

- [ ] B.5.a [TEST-RED] 写 `updateCommentStatus / deleteComment throw NOT_FOUND on missing id` 粘 FAIL
- [ ] B.5.b [IMPL-GREEN] update / delete 前先 findUnique，缺则 `throw errors.notFound`；粘 PASS

## §C [P1-C] review-api

### C.1 zod schema 边界

- [ ] C.1.a [TEST-RED] 在 `src/lib/schemas/comment.test.ts` 追加 `commentFilterSchema` + `commentStatusUpdateSchema` + `commentBulkUpdateSchema` 边界用例（status enum / ids 非空 / page bounds）粘 FAIL
- [ ] C.1.b [IMPL-GREEN] 在 `src/lib/schemas/comment.ts` 追加上述 schema export；粘 PASS

### C.2 [SPEC-C-A-1] GET /api/admin/comments

- [ ] C.2.a [TEST-RED] 写 `GET /api/admin/comments?status=PENDING returns 200 + meta` 粘 FAIL
- [ ] C.2.b [IMPL-GREEN] 新增 `src/app/api/admin/comments/route.ts#GET`：auth 守 + commentFilterSchema.parse + listCommentsForAdmin → `ok(items, meta)`；粘 PASS

### C.3 [SPEC-C-A-2..3] PATCH + DELETE 单条

- [ ] C.3.a [TEST-RED] 写 `PATCH [id] updates + reviewedBy` + `DELETE [id] removes` 粘 FAIL
- [ ] C.3.b [IMPL-GREEN] 新增 `src/app/api/admin/comments/[id]/route.ts#PATCH + DELETE`：auth + 解 body via commentStatusUpdateSchema + 调 service；粘 PASS

### C.4 [SPEC-C-A-4] POST /api/admin/comments/bulk

- [ ] C.4.a [TEST-RED] 写 `POST /bulk updates 3 ids` 粘 FAIL
- [ ] C.4.b [IMPL-GREEN] 新增 `src/app/api/admin/comments/bulk/route.ts#POST`：auth + commentBulkUpdateSchema.parse + bulkUpdateCommentStatus；粘 PASS

### C.5 [SPEC-C-A-5] 401 未登录

- [ ] C.5.a [TEST-RED] 写各 route `mockAuth(null) → 401` 粘 FAIL（已在 C.2.a~C.4.a 内 mock auth；本节额外断 null session 路径）
- [ ] C.5.b [IMPL-GREEN] 各路由内 `const session = await auth(); if (!session) throw errors.unauthorized()`；粘 PASS

## §D [P1-C] review-ui

### D.1 [SPEC-C-U-2..3] CommentsTable + BulkActions

- [ ] D.1.a [TEST-RED] 写 `<CommentsTable /> renders rows + inline approve/spam/reject/delete + 乐观 + 回滚` + `multi-select + BulkActions` jsdom 测试粘 FAIL
- [ ] D.1.b [IMPL-GREEN] 新增 `src/components/admin/comments/CommentsTable.tsx`（client）+ `BulkActions` 内部子组件；useState 管理 selectedIds；fetch PATCH / POST bulk；toast 反馈；粘 PASS

### D.2 [SPEC-C-U-1] page.tsx 4 tab + URL sync

- [ ] D.2.a [TEST-RED] 写 `<CommentsAdminPage /> 4 tabs + counts + URL sync` 测试（mock service + 验证 props 传到 CommentsTable）粘 FAIL
- [ ] D.2.b [IMPL-GREEN] 新增 `src/app/(admin)/admin/comments/page.tsx`（server）：parseSearchParams + listCommentsForAdmin (each status 计数) + 嵌入 `<CommentsTable>`；粘 PASS

### D.3 [SPEC-C-U-4] AdminSidebar 加 link

- [ ] D.3.a [TEST-RED] 改 `AdminSidebar.test.tsx` 加 `includes 评论管理 link` 粘 FAIL
- [ ] D.3.b [IMPL-GREEN] 改 `src/components/admin/AdminSidebar.tsx` 加 link 项；粘 PASS

## §E 集成验收

- [ ] E.1 跑 `pnpm typecheck && pnpm lint && pnpm test`，全绿（基线 286 → 310+）
- [ ] E.2 跑 `pnpm build` 确认无 prerender 回归
- [ ] E.3 manual smoke：admin 端
  - 登录 → 进 /admin/comments → 看到 PENDING 评论（D3 提交的）
  - 点 APPROVE 行内按钮 → 行 status 变 + 前台 commentCount +1
  - 多选 + bulk approve → 多行同时变
  - DELETE → 行消失
  - 切到其他 tab → 看到对应 status 数据
- [ ] E.4 更新 `memory-bank/{progress,activeContext}.md` + 本 tasks.md commit 快照

## §F 收尾

- [ ] F.1 commit 历史快照表
- [ ] F.2 ha1den decision：是否进入下一 epic（Analytics 上报 / Hero 重做 / archive 3 个 SDD）

## 备注

- §0.2 schema migration 是 destructive 操作，需 ha1den 先确认 prisma schema diff 再跑 migrate
- §A counter-fix 会改 D3 已有测试的 commentCount 期望（SPEC-D3-C-1/C-2/C-3 三处）—— 标 RED 时一并修改，与新 SPEC-C-F-1..3 同 commit
- §B.4 cascade reply 处理需要 service 层手动 deleteMany replies（因 Prisma `Comment.parent: NoAction`，不自动 cascade）
- §C zod schema 校验为 API 必要的 RED 测试（CLAUDE.md TDD 铁律 #2）
- §D BulkActions 不独立组件，作为 CommentsTable 内部子组件，避免单独 1 个微循环
