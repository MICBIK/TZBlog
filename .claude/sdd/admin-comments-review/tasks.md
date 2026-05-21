# tasks.md — admin-comments-review

> 微循环结构：1 spec scenario = 1 微循环（`.a [TEST-RED]` + `.b [IMPL-GREEN]`）
> 阶段前缀 `[P1-C]`
> commit scope 约定：`comments-schema` / `counter-fix` / `comments-admin-service` / `comments-admin-api` / `comments-admin-ui` / `admin-sidebar`

## §0 准备

- [x] §0.1 SDD 五件套（proposal + 5×spec + test-map + tasks）一次性建好提交 — commit `6e81598` `docs(sdd): admin-comments-review scaffold [no-tdd]`
- [x] §0.2 schema migration — commits `7bfd71f` (test) + `489f002` (feat)
  - 改 `prisma/schema.prisma`：`Comment` 加 `reviewedBy String?` + `reviewedAt DateTime?` + `@@index([status, createdAt])`
  - `prisma migrate dev --name add_comment_review_fields` applied (migration `20260521132300_add_comment_review_fields`)
  - 新增 schema 测试 `src/lib/services/comments-schema.test.ts` 3 case（accepts/null/ai-* prefix）
  - 现有 6 spec 不回归

## §A [P1-C] counter-fix (修正 D3 R5)

### A.1 [SPEC-C-F-1] createComment 不再 +1

- [x] A.1.a [TEST-RED] 改 D3 SPEC-D3-C-1/C-2 commentCount 期望 1→0 — commit `9d1859c`
- [x] A.1.b [IMPL-GREEN] 删 createComment 内 `tx.post.update {commentCount increment}` + 简化 $transaction 为单 op — commit `f0d96a0`

### A.2 [SPEC-C-F-2] updateCommentStatus 流转 +/-

- [x] A.2.a [TEST-RED] 合并到 comments-admin-service RED — commit `521341e`
- [x] A.2.b [IMPL-GREEN] 合并到 comments-admin-service GREEN — commit `deb4a00`

### A.3 [SPEC-C-F-3] deleteComment 计数器调整

- [x] A.3.a [TEST-RED] — 合并到 comments-admin-service RED
- [x] A.3.b [IMPL-GREEN] — 合并到 comments-admin-service GREEN（cascade replies 含 approved-replies count）

## §B [P1-C] review-service

### B.1-B.5 [SPEC-C-V-1..8] 全部 service mutations + queries

- [x] B.1.a [TEST-RED] 一次性写 14 case 覆盖 SPEC-C-F-2..3 + SPEC-C-V-1..8 — commit `521341e`
- [x] B.1.b [IMPL-GREEN] 新增 4 函数 — commit `deb4a00`
  - `listCommentsForAdmin(filter)`: WHERE { status?, postId?, q? in name/email/content insensitive } + include post.slug + post.translations(DEFAULT_LOCALE).title
  - `updateCommentStatus(id, status, reviewerId)`: 事务 update + reviewedBy/reviewedAt + commentCount 调整（→ APPROVED +1 / APPROVED→其他 -1 / 其他 0）；幂等
  - `bulkUpdateCommentStatus(ids, status, reviewerId)`: loop 调单 update（复用计数器逻辑），NOT_FOUND 跳过
  - `deleteComment(id)`: 顶层时先 deleteMany replies；自身 + approved replies 累计计数器调整

## §C [P1-C] review-api

### C.1 zod schema 边界

- [x] C.1.a [TEST-RED] 13 admin schema 边界用例 — commit `5d393ef`
- [x] C.1.b [IMPL-GREEN] commentStatusEnum + commentFilterSchema + commentStatusUpdateSchema + commentBulkUpdateSchema — commit `104e556`

### C.2-C.5 3 路由全套

- [x] C.2.a [TEST-RED] 8 测试覆盖 3 路由 5 endpoint + 4 个 401 case — commit `7419b91`
- [x] C.2.b [IMPL-GREEN] 3 route file — commit `5eff583`
  - `GET /api/admin/comments`: requireAdminSession → commentFilterSchema.parse(searchParams) → listCommentsForAdmin
  - `PATCH/DELETE /api/admin/comments/[id]`: requireAdminSession → 子 schema → service 函数
  - `POST /api/admin/comments/bulk`: requireAdminSession → commentBulkUpdateSchema → bulkUpdateCommentStatus

## §D [P1-C] review-ui

### D.1 [SPEC-C-U-2..3] CommentsTable + BulkActions

- [x] D.1.a [TEST-RED] 5 jsdom 用例（渲染 + inline 通过 + delete + 多选 BulkActions + PATCH 失败回滚）— commit `d1c2ae0`
- [x] D.1.b [IMPL-GREEN] 完整 CommentsTable：多选 checkbox + 4 行内动作 + BulkActions 顶部条 + 乐观更新 + 失败回滚 + status badge 4 色 — commit `cb7d4b4`
  - 附带: 测试 1 处 regex 过宽改为 getByRole link "你好"

### D.2 [SPEC-C-U-1] page.tsx 4 tab + URL sync

- [x] D.2.a [TEST-RED] 2 jsdom 用例（4 tab links + status filter 传递）— commit `75ffd00`
- [x] D.2.b [IMPL-GREEN] page.tsx 5 路并行 listCommentsForAdmin + 4 tab + filter parse — commit `88cd33e`

### D.3 [SPEC-C-U-4] AdminSidebar 加 link

- [x] D.3 **跳过**：P0 阶段 AdminSidebar 已含 `/admin/comments` link（line 23），spec 已满足

## §E 集成验收

- [x] E.1 跑 `pnpm typecheck && pnpm lint && pnpm test`，全绿（47 files / 329 passed / 1 skipped，基线 286 → 329，+43 specs）
- [x] E.2 跑 `pnpm build` 确认无 prerender 回归（24+ 路由，新增 `/admin/comments` + `/api/admin/comments/*` + `/api/admin/comments/bulk`）
- [ ] E.3 manual smoke（待 ha1den）：admin 端
  - 登录 → 进 `/admin/comments` → 看到 PENDING 评论（D3 提交的）
  - 点 行内「通过」按钮 → 行 status 变 + 前台 commentCount +1
  - 多选 + 顶部「批量通过」→ 多行同时变
  - 行内「删除」→ 行消失
  - 切到其他 tab → 看到对应 status 数据
- [x] E.4 更新 `memory-bank/{progress,activeContext}.md` + 本 tasks.md commit 快照

## §F 收尾

- [x] F.1 commit 历史快照表（见下方）
- [ ] F.2 ha1den decision：是否进入下一 epic（Analytics 上报 / Hero 重做 / archive 3 个 SDD）

## Commit 历史快照

| commit | 阶段 | spec id |
|---|---|---|
| `6e81598` | §0.1 SDD scaffold [no-tdd] | — |
| `7bfd71f` | §0.2.a comments-schema [TEST] | SPEC-C-S-1..2 |
| `489f002` | §0.2.b comments-schema [FEAT] | SPEC-C-S-1..2 |
| `9d1859c` | §A.1.a counter-fix [TEST-RED] | SPEC-C-F-1 |
| `f0d96a0` | §A.1.b counter-fix [IMPL-GREEN] | SPEC-C-F-1 |
| `521341e` | §A.2-3 + §B.1-5 comments-admin-service [TEST-RED] | SPEC-C-F-2..3 + V-1..8 |
| `deb4a00` | §A.2-3 + §B.1-5 comments-admin-service [IMPL-GREEN] | SPEC-C-F-2..3 + V-1..8 |
| `5d393ef` | §C.1.a comment-schema admin [TEST] | SPEC-C-A schemas |
| `104e556` | §C.1.b comment-schema admin [FEAT] | SPEC-C-A schemas |
| `7419b91` | §C.2-5 comments-admin-api [TEST-RED] | SPEC-C-A-1..5 |
| `5eff583` | §C.2-5 comments-admin-api [IMPL-GREEN] | SPEC-C-A-1..5 |
| `d1c2ae0` | §D.1.a comments-admin-ui [TEST-RED] | SPEC-C-U-2..3 |
| `cb7d4b4` | §D.1.b comments-admin-ui [IMPL-GREEN] | SPEC-C-U-2..3 |
| `75ffd00` | §D.2.a comments-admin-page [TEST-RED] | SPEC-C-U-1 |
| `88cd33e` | §D.2.b comments-admin-page [IMPL-GREEN] | SPEC-C-U-1 |

> 节奏：scaffold 1 + 7 个 commit pair = 15 commit，scope 一致，husky 全过。
> §D.3 AdminSidebar link 已在 P0 阶段落地（line 23），跳过。
> test 基线 286 → 329（+43 specs，含 schema 测试 3 + 计数器修正 1 + service mutations 14 + admin schemas 13 + admin API 8 + CommentsTable 5 + page 2 = 46，扣除两处 collateral 改动）。
