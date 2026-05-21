# tasks.md — comments-and-likes

> 微循环结构：1 spec scenario = 1 微循环 (`.a [TEST-RED]` + `.b [IMPL-GREEN]`)
> 阶段前缀 `[P2-D3]`
> 顺序：先 schema → 再 service → 再 API → 再 UI → 最后详情页接入；点赞与评论两条线可并行（实际单线推）
> commit scope 约定：`likes-service` / `likes-api` / `like-button` / `comment-schema` / `comments-service` / `comments-api` / `comment-form` / `comment-list` / `post-detail-d3`

## §0 准备

- [x] §0.1 SDD 三件套（proposal + 2×spec + test-map + tasks）一次性建好提交 — `docs(sdd): comments-and-likes scaffold [no-tdd]`
- [ ] §0.2 docker 起着确认（dev postgres 5433）— 跑 TDD 前必备

## §A [P2-D3] likes capability

### A.1 [SPEC-D3-L-1] addLike 首次写入 + 计数器

- [ ] A.1.a [TEST-RED] 写 `addLike first time creates row + increments likeCount` 集成测试，跑 `pnpm test src/lib/services/likes.test.ts` 粘 FAIL
- [ ] A.1.b [IMPL-GREEN] 新增 `src/lib/services/likes.ts#addLike(slug, visitorHash)`：内含事务（`postLike.create` + `post.update {likeCount: increment 1}`）+ 返回 `{liked, likeCount}`，粘 PASS

### A.2 [SPEC-D3-L-2] addLike 幂等

- [ ] A.2.a [TEST-RED] 写 `addLike is idempotent on duplicate visitorHash` 测试粘 FAIL
- [ ] A.2.b [IMPL-GREEN] 在 A.1.b 实现中 catch `P2002` 当 idempotent 处理（不增计数器，返回 current likeCount），粘 PASS

### A.3 [SPEC-D3-L-3] hasLikedBy

- [ ] A.3.a [TEST-RED] 写 `hasLikedBy returns true/false correctly` 测试粘 FAIL
- [ ] A.3.b [IMPL-GREEN] 在 `likes.ts` 加 `hasLikedBy(slug, visitorHash)` 查询，粘 PASS

### A.4 [SPEC-D3-L-4] addLike NOT_FOUND

- [ ] A.4.a [TEST-RED] 写 `addLike throws NOT_FOUND when slug missing` 测试粘 FAIL
- [ ] A.4.b [IMPL-GREEN] addLike 内先 findUnique post，缺则 `throw errors.notFound(...)`，粘 PASS

### A.5 [SPEC-D3-L-5..7] like 路由（合并 3 spec）

- [ ] A.5.a [TEST-RED] 写 `POST /api/posts/[slug]/like → 200` + `POST → 404 on missing` + `GET returns per-visitor state` 三个 case，跑 `pnpm test src/app/api/posts/[slug]/like/route.test.ts` 粘 FAIL
- [ ] A.5.b [IMPL-GREEN] 新增 `src/app/api/posts/[slug]/like/route.ts`：`POST` 调 `getVisitorHash(req)` + `addLike`；`GET` 调 `hasLikedBy` + 查 post.likeCount，粘 PASS

### A.6 [SPEC-D3-L-8] LikeButton 行为

- [ ] A.6.a [TEST-RED] 写 `<LikeButton /> mount-fetch + optimistic click + rollback` jsdom 测试粘 FAIL
- [ ] A.6.b [IMPL-GREEN] 新增 `src/components/site/LikeButton.tsx`：`useEffect` GET 初态；点击 setState 乐观更新；fetch POST；catch 回滚 + toast 错误，粘 PASS

## §B [P2-D3] comments capability

### B.1 [SPEC-D3-C-6] commentCreateSchema zod 校验

- [ ] B.1.a [TEST-RED] 写 `commentCreateSchema 边界` 测试（authorName/email/content min/max/website/parentId 全覆盖），跑 `pnpm test src/lib/schemas/comment.test.ts` 粘 FAIL
- [ ] B.1.b [IMPL-GREEN] 新增 `src/lib/schemas/comment.ts#commentCreateSchema`：zod object，粘 PASS

### B.2 [SPEC-D3-C-1] createComment 顶层 + 计数器

- [ ] B.2.a [TEST-RED] 写 `createComment top-level inserts PENDING + commentCount +1` 集成测试粘 FAIL
- [ ] B.2.b [IMPL-GREEN] 新增 `src/lib/services/comments.ts#createComment`：事务内 insert PENDING + post.commentCount + 1，粘 PASS

### B.3 [SPEC-D3-C-2] createComment 1 层 reply

- [ ] B.3.a [TEST-RED] 写 `createComment with valid parentId creates depth-2 reply` 测试粘 FAIL
- [ ] B.3.b [IMPL-GREEN] createComment 接收 parentId，查 parent 存在且 parent.parentId === null，OK 则插入，粘 PASS

### B.4 [SPEC-D3-C-3] reply-of-reply 拒绝

- [ ] B.4.a [TEST-RED] 写 `createComment rejects reply-of-reply (depth > 2)` 测试粘 FAIL
- [ ] B.4.b [IMPL-GREEN] createComment 检测 parent.parentId !== null 则 throw VALIDATION，粘 PASS

### B.5 [SPEC-D3-C-4..5] NOT_FOUND slug / parentId

- [ ] B.5.a [TEST-RED] 写 `createComment throws NOT_FOUND on missing slug` + `... on missing parentId` 两个 case 粘 FAIL
- [ ] B.5.b [IMPL-GREEN] createComment 内 post / parent 缺时 throw NOT_FOUND，粘 PASS

### B.6 [SPEC-D3-C-7] listApprovedComments 嵌套

- [ ] B.6.a [TEST-RED] 写 `listApprovedComments returns nested APPROVED only, top sorted asc` 测试粘 FAIL
- [ ] B.6.b [IMPL-GREEN] 新增 `listApprovedComments(postId)`：一次 findMany 拉 APPROVED，内存折叠成 parent+replies 结构，粘 PASS

### B.7 [SPEC-D3-C-8..9] comments 路由

- [ ] B.7.a [TEST-RED] 写 `POST rate-limits 5min/3` + `GET APPROVED-only nested` 测试粘 FAIL
- [ ] B.7.b [IMPL-GREEN] 新增 `src/app/api/posts/[slug]/comments/route.ts`：POST 走 `checkRateLimit("comment:"+vh, 3, 300_000)` + zod.parse + createComment；GET 调 listApprovedComments，粘 PASS

### B.8 [SPEC-D3-C-10] CommentForm UX

- [ ] B.8.a [TEST-RED] 写 `<CommentForm /> submit success/429/error UX` jsdom 测试粘 FAIL
- [ ] B.8.b [IMPL-GREEN] 新增 `src/components/site/CommentForm.tsx`：react-hook-form + zodResolver + fetch POST + 三态 UI，粘 PASS

### B.9 [SPEC-D3-C-11] CommentList 嵌套渲染

- [ ] B.9.a [TEST-RED] 写 `<CommentList /> renders top + 1 layer reply with indent` jsdom 测试粘 FAIL
- [ ] B.9.b [IMPL-GREEN] 新增 `src/components/site/CommentList.tsx`：map 顶层 + 嵌入 reply（`pl-8`）+ 顶层有「回复」按钮（client 子组件控制 form 切换），粘 PASS

### B.10 [SPEC-D3-C-12] PostDetailPage 接入

- [ ] B.10.a [TEST-RED] 在 `src/app/(site)/posts/[slug]/page.test.tsx` 追加 `embeds LikeButton + CommentSection, hides PENDING` 粘 FAIL
- [ ] B.10.b [IMPL-GREEN] 改 `page.tsx`：line 112 计数 → `<LikeButton slug=... initialLikeCount=... />`；article 末尾挂 `<CommentSection postId=... slug=... />`，粘 PASS
  - 新增 `src/components/site/CommentSection.tsx`（server）：`await listApprovedComments(postId)` + 嵌入 `<CommentList />` + `<CommentForm />`

## §C 集成验收

- [ ] C.1 跑 `pnpm typecheck && pnpm lint && pnpm test`，全绿
- [ ] C.2 跑 `pnpm build` 确认无 prerender 回归
- [ ] C.3 manual smoke：起 dev server，访问任意 PUBLISHED 文章
  - 点赞按钮：点击 → 数字 +1 → 刷新页面仍 +1 → 再点击数字不变
  - 评论：填表提交 → 显示「等待审核」→ 评论不立刻显示（PENDING）
  - 评论 reply：admin SQL 把刚才的评论改成 APPROVED → 刷新文章页 → 评论显示 → 点「回复」→ 提交 reply
- [ ] C.4 更新 `memory-bank/{progress,activeContext}.md`

## §D 收尾

- [ ] D.1 commit 历史快照表
- [ ] D.2 ha1den decision：是否进入下一 epic（评论审核页 / Analytics 上报 / Hero 重做）

## 备注

- D3 不修改 Prisma schema；不装新依赖
- rate-limit 用现成 `lib/rate-limit.ts`；测试时需用 `vi.useFakeTimers` 或重置 store（前者更稳）
- 评论审核 UI 不在 D3 范围，PENDING 评论暂时只能 SQL 改 APPROVED 验证 reply 路径
- 与 P2-E 一致的 commit 节奏：每微循环 `test(<scope>):` + `feat(<scope>):` 双 commit，scope 与 §A/§B 节标题对齐
