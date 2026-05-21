# Proposal — admin-comments-review (C)

> Stage: P1 收尾 — 评论审核页
> Created: 2026-05-21
> Path: `.claude/sdd/admin-comments-review/`

## Why

D3 已造好 PENDING 评论流入路径（用户提交即写入 `status: PENDING`），admin 端需要审核工具：
- 4 状态切换：`PENDING → APPROVED / SPAM / REJECTED`
- 批量操作降低人工成本
- 审核人 + 时间记录（R9 ha1den 决策：为未来 AI 审核接入留铺垫）
- D3 计数器决策修正（R6 修正 D3 R5：`commentCount` 仅计 APPROVED）

不修这层，PENDING 评论永远不会出现在前台，D3 评论区等于"匿名留言归档"。

## What

C 范围（一次性闭环）：

### Capability: counter-fix（D3 R5 修正）
- 改 `createComment` 不再 `commentCount +1`
- 改 `updateCommentStatus`：`非-APPROVED → APPROVED` 时 +1；`APPROVED → 非-APPROVED` 时 -1
- 改 `deleteComment`：原 status 是 APPROVED 则 -1

### Capability: review-service
- `listCommentsForAdmin(filter)`：4 status 全状态可见 + 分页 + 关联 post slug/title + q 搜（authorName/content）
- `updateCommentStatus(id, status, reviewerId)`：单条改 status + 写 `reviewedBy + reviewedAt`，幂等（同 status 不报错）
- `bulkUpdateCommentStatus(ids, status, reviewerId)`：批量改
- `deleteComment(id, reviewerId?)`：真删除（cascade replies；reviewerId 用于 audit 但不存）

### Capability: review-api `/api/admin/comments/`
- `GET /` 列表
- `PATCH /[id]` 单条
- `DELETE /[id]` 真删
- `POST /bulk` 批量
- 全部 auth 守卫，未登录 401

### Capability: review-ui `/admin/comments/`
- `page.tsx` 4 tab + 列表
- `CommentsTable.tsx` 行展示 + 多选 + 行内动作
- `CommentsFilters.tsx` q 搜 + post 过滤
- `BulkActions.tsx` 批量操作栏
- AdminSidebar 加入「评论管理」link

### Schema 迁移（prerequisite）
- `Comment` 加 `reviewedBy String?` + `reviewedAt DateTime?`
- `reviewedBy` 非 FK，存 user.id 或 "ai-{model}-{version}" 之类的 marker
- migration 名：`add_comment_review_fields`

### 不在 C 范围（推迟）
- AI 自动审核 → V3（R9 铺垫，未具体落地）
- 软删除 → MVP 不做（R8 选真删）
- 审核员邮件通知 → V2

## Decisions made before kicking off

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R6 | commentCount 含 PENDING vs 仅 APPROVED | **仅 APPROVED** | 前台 `comments N` 数字准确；修正 D3 R5 |
| R7 | 审核幂等性 | **幂等**：重复 approve 已 approved 返 200 不抛 | 简化批量 UI；用户多次点同按钮不挫败 |
| R8 | 删除语义 | **真删 cascade** | SPAM 状态已代替软删除场景；不引入 deletedAt 复杂度 |
| R9 | 审核人记录 | **记录 reviewedBy + reviewedAt** | 为未来 AI 审核接入铺垫；`reviewedBy String?` 兼容 user.id / "ai-xxx" |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| schema-migration | `specs/schema-migration/spec.md` | SPEC-C-S-1..2 |
| counter-fix | `specs/counter-fix/spec.md` | SPEC-C-F-1..3 |
| review-service | `specs/review-service/spec.md` | SPEC-C-V-1..8 |
| review-api | `specs/review-api/spec.md` | SPEC-C-A-1..5 |
| review-ui | `specs/review-ui/spec.md` | SPEC-C-U-1..4 |

## Impact

- 新建：~12 文件（schemas / service 扩展 / 4 个 api routes / 4 个 UI 组件 + 测试 + page）
- 修改：`prisma/schema.prisma`（加 2 字段）/ `src/lib/services/comments.ts`（扩 4 函数 + 改 createComment）/ `src/components/admin/AdminSidebar.tsx`（加 link）
- Prisma migration: `add_comment_review_fields`
- 不装新依赖

## Out of scope

- AI 审核 backend（推 V3）
- 软删除
- 审核邮件通知
- 评论举报功能（用户端 report button）
- 评论编辑（admin 改 content）

## Workflow

按 D3 教训，全程严格 SDD：
1. proposal + 5×spec + test-map + tasks 一次性建好提交（`docs(sdd): admin-comments-review scaffold [no-tdd]`）
2. **§0 prisma migration 单独 commit**（含 schema 变更 + `prisma migrate dev` 产物），scope `comments-schema`，加 `[no-tdd]` 因为 schema 改不在 TDD 范畴
3. 后续每个微循环走 `test(<scope>):` → `feat(<scope>):` 双 commit 节奏
4. scope 建议：`comments-schema` / `counter-fix` / `comments-admin-service` / `comments-admin-api` / `comments-admin-ui` / `admin-sidebar`
