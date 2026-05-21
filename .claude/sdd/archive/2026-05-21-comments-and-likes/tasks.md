# tasks.md — comments-and-likes

> 微循环结构：1 spec scenario = 1 微循环 (`.a [TEST-RED]` + `.b [IMPL-GREEN]`)
> 阶段前缀 `[P2-D3]`
> 顺序：先 schema → 再 service → 再 API → 再 UI → 最后详情页接入；点赞与评论两条线可并行（实际单线推）
> commit scope 约定：`likes-service` / `likes-api` / `like-button` / `comment-schema` / `comments-service` / `comments-api` / `comment-form` / `comment-list` / `post-detail-d3`

## §0 准备

- [x] §0.1 SDD 三件套（proposal + 2×spec + test-map + tasks）一次性建好提交 — `docs(sdd): comments-and-likes scaffold [no-tdd]`
- [x] §0.2 docker 起着确认（dev postgres 5433）— 跑 TDD 前必备

## §A [P2-D3] likes capability

### A.1 [SPEC-D3-L-1] addLike 首次写入 + 计数器

- [x] A.1.a [TEST-RED] 写 `addLike first time creates row + increments likeCount` 集成测试（合并 SPEC-D3-L-1..4 一并 RED）— commit `d7e7aad`
- [x] A.1.b [IMPL-GREEN] 新增 `src/lib/services/likes.ts#addLike(slug, visitorHash)` — commit `2a40d10`

### A.2 [SPEC-D3-L-2] addLike 幂等

- [x] A.2.a [TEST-RED] — 与 A.1.a 同 RED 提交（4 spec batch）
- [x] A.2.b [IMPL-GREEN] catch `P2002` 当 idempotent — 与 A.1.b 同 GREEN 提交

### A.3 [SPEC-D3-L-3] hasLikedBy

- [x] A.3.a [TEST-RED] — 与 A.1.a 同 RED
- [x] A.3.b [IMPL-GREEN] — 与 A.1.b 同 GREEN

### A.4 [SPEC-D3-L-4] addLike NOT_FOUND

- [x] A.4.a [TEST-RED] — 与 A.1.a 同 RED
- [x] A.4.b [IMPL-GREEN] findUnique post 缺则 `throw errors.notFound(...)` — 与 A.1.b 同 GREEN

### A.5 [SPEC-D3-L-5..7] like 路由（合并 3 spec）

- [x] A.5.a [TEST-RED] `POST → 200` + `POST → 404 missing` + `GET per-visitor state` — commit `a9dad85`
- [x] A.5.b [IMPL-GREEN] `src/app/api/posts/[slug]/like/route.ts`：POST `addLike` / GET `hasLikedBy` + 404 守卫 — commit `047888d`

### A.6 [SPEC-D3-L-8] LikeButton 行为

- [x] A.6.a [TEST-RED] `<LikeButton />` mount-fetch + optimistic click + rollback — commit `238f13c`
- [x] A.6.b [IMPL-GREEN] `useEffect` GET 初态 / click 乐观 +1 / fetch POST / catch 回滚 + toast — commit `8ab8df9`
  - 附带：第 3 测试用 deferred Promise 控制 POST 时序

## §B [P2-D3] comments capability

### B.1 [SPEC-D3-C-6] commentCreateSchema zod 校验

- [x] B.1.a [TEST-RED] 13 边界用例 — commit `9517433`
- [x] B.1.b [IMPL-GREEN] `src/lib/schemas/comment.ts#commentCreateSchema` — commit `a59a819`

### B.2 [SPEC-D3-C-1] createComment 顶层 + 计数器

- [x] B.2.a [TEST-RED] — 合并 SPEC-D3-C-1..5+C-7 一并 RED — commit `f9c58a0`
- [x] B.2.b [IMPL-GREEN] — 与 B.6.b 同 GREEN — commit `cd0d5bf`

### B.3 [SPEC-D3-C-2] createComment 1 层 reply

- [x] B.3.a [TEST-RED] — 与 B.2.a 同 RED
- [x] B.3.b [IMPL-GREEN] — 与 B.2.b 同 GREEN（parent.parentId === null 校验）

### B.4 [SPEC-D3-C-3] reply-of-reply 拒绝

- [x] B.4.a [TEST-RED] — 与 B.2.a 同 RED
- [x] B.4.b [IMPL-GREEN] parent.parentId !== null 则 `throw errors.validation(...)` — 与 B.2.b 同 GREEN

### B.5 [SPEC-D3-C-4..5] NOT_FOUND slug / parentId

- [x] B.5.a [TEST-RED] — 与 B.2.a 同 RED
- [x] B.5.b [IMPL-GREEN] post / parent 缺则 throw NOT_FOUND — 与 B.2.b 同 GREEN

### B.6 [SPEC-D3-C-7] listApprovedComments 嵌套

- [x] B.6.a [TEST-RED] — 与 B.2.a 同 RED
- [x] B.6.b [IMPL-GREEN] findMany APPROVED + 内存折叠成 parent+replies（depth=2 限制 reply.replies=[]）— commit `cd0d5bf`

### B.7 [SPEC-D3-C-8..9] comments 路由

- [x] B.7.a [TEST-RED] `POST rate-limit 5min/3` + `GET APPROVED-only nested` + missing slug → 404 — commit `a4e5ba4`
- [x] B.7.b [IMPL-GREEN] POST `checkRateLimit("comment:"+vh, 3, 5min)` + zod.parse + createComment → 201；GET findUnique post + listApprovedComments — commit `be66c27`

### B.8 [SPEC-D3-C-10] CommentForm UX

- [x] B.8.a [TEST-RED] success / 429 / error / reply mode — commit `1eb3b65`
- [x] B.8.b [IMPL-GREEN] react-hook-form + zodResolver + 表单 schema 接受空字符串 website，submit 时转 undefined；4 状态 banner — commit `fcf3779`

### B.9 [SPEC-D3-C-11] CommentList 嵌套渲染

- [x] B.9.a [TEST-RED] 顶层顺序 / reply pl-8 缩进 / 顶层有「回复」按钮 / reply 没有 / 点击展开 CommentForm — commit `c9112b5`
- [x] B.9.b [IMPL-GREEN] useState openReplyFor 控制单顶层评论展开 inline CommentForm；reply 在 nested `<li data-comment-reply class="pl-8 border-l">` — commit `e87c165`

### B.10 [SPEC-D3-C-12] PostDetailPage 接入

- [x] B.10.a [TEST-RED] page.test.tsx mock LikeButton + CommentSection + 新 case；CommentSection.tsx 占位 stub — commit `8fd0c8f`
- [x] B.10.b [IMPL-GREEN] CommentSection 真实现（await listApprovedComments + CommentList + 顶层 CommentForm）；page.tsx 计数行替换 LikeButton + article 末尾挂 CommentSection — commit `4bf15a8`

## §C 集成验收

- [x] C.1 跑 `pnpm typecheck && pnpm lint && pnpm test`，全绿（41 files / 286 passed / 1 skipped，+41 specs from 245 基线）
- [x] C.2 跑 `pnpm build` 确认无 prerender 回归（22+ 路由全过，新增 `/api/posts/[slug]/comments` + `/api/posts/[slug]/like`）
- [ ] C.3 manual smoke（待 ha1den）：起 dev server 访问任意 PUBLISHED 文章
  - 点赞：点击 → 数字 +1 → 刷新仍 +1 → 再点击不变
  - 评论：填表提交 → 显示「等待审核」→ 评论 PENDING 不立刻显示
  - reply：SQL 把刚才评论改 APPROVED → 刷新页面 → 评论显示 → 点「回复」展开嵌入 form → 提交 reply
- [x] C.4 更新 `memory-bank/{progress,activeContext}.md` + 本 tasks.md commit 快照

## §D 收尾

- [x] D.1 commit 历史快照表（见下方）
- [ ] D.2 ha1den decision：是否进入下一 epic（评论审核页 / Analytics 上报 / Hero 重做）

## Commit 历史快照

| commit | 阶段 | spec id |
|---|---|---|
| `843d2df` | §0.1 SDD scaffold [no-tdd] | — |
| `d7e7aad` | A.1.a-A.4.a likes-service [TEST-RED] | SPEC-D3-L-1..4 |
| `2a40d10` | A.1.b-A.4.b likes-service [IMPL-GREEN] | SPEC-D3-L-1..4 |
| `a9dad85` | A.5.a likes-api [TEST-RED] | SPEC-D3-L-5..7 |
| `047888d` | A.5.b likes-api [IMPL-GREEN] | SPEC-D3-L-5..7 |
| `238f13c` | A.6.a like-button [TEST-RED] | SPEC-D3-L-8 |
| `8ab8df9` | A.6.b like-button [IMPL-GREEN] | SPEC-D3-L-8 |
| `9517433` | B.1.a comment-schema [TEST-RED] | SPEC-D3-C-6 |
| `a59a819` | B.1.b comment-schema [IMPL-GREEN] | SPEC-D3-C-6 |
| `f9c58a0` | B.2.a-B.6.a comments-service [TEST-RED] | SPEC-D3-C-1..5+C-7 |
| `cd0d5bf` | B.2.b-B.6.b comments-service [IMPL-GREEN] | SPEC-D3-C-1..5+C-7 |
| `a4e5ba4` | B.7.a comments-api [TEST-RED] | SPEC-D3-C-8..9 |
| `be66c27` | B.7.b comments-api [IMPL-GREEN] | SPEC-D3-C-8..9 |
| `1eb3b65` | B.8.a comment-form [TEST-RED] | SPEC-D3-C-10 |
| `fcf3779` | B.8.b comment-form [IMPL-GREEN] | SPEC-D3-C-10 |
| `c9112b5` | B.9.a comment-list [TEST-RED] | SPEC-D3-C-11 |
| `e87c165` | B.9.b comment-list [IMPL-GREEN] | SPEC-D3-C-11 |
| `8fd0c8f` | B.10.a post-detail-d3 [TEST-RED] | SPEC-D3-C-12 |
| `4bf15a8` | B.10.b post-detail-d3 [IMPL-GREEN] | SPEC-D3-C-12 |

> 节奏：scaffold 1 + likes 6 + comments 12 = 19 个 commit，全部 `test(<scope>)` → `feat(<scope>)` 严格配对，scope 一致，husky commit-msg hook 全通过。test 基线 245 → 286（+41 specs）。本 SDD 全程严格按 CLAUDE.md TDD 铁律 #2 走（先 proposal → specs → test-map → tasks），无追溯补齐。

## 备注

- D3 不修改 Prisma schema；不装新依赖
- rate-limit 用现成 `lib/rate-limit.ts`；测试时需用 `vi.useFakeTimers` 或重置 store（前者更稳）
- 评论审核 UI 不在 D3 范围，PENDING 评论暂时只能 SQL 改 APPROVED 验证 reply 路径
- 与 P2-E 一致的 commit 节奏：每微循环 `test(<scope>):` + `feat(<scope>):` 双 commit，scope 与 §A/§B 节标题对齐
