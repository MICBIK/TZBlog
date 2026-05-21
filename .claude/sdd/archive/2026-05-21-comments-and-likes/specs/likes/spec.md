# Spec — likes (D3)

> Capability: 永久 unique 一次性点赞（每访客对每文章 lifetime 1 次）
> Stage: P2-D3
> SPEC-ID 前缀：`SPEC-D3-L-`

## Domain rules

- 计数源：`Post.likeCount`（事务内 `+1`）
- 去重源：`PostLike (@@unique [postId, visitorHash])`
- 访客身份：`visitorHash = sha256(ip + userAgent + dailySalt)`（来自 `lib/visitor.ts`）
- 点赞**永久**：一旦点过，再次 POST 幂等，不再增 likeCount
- 不支持取消点赞（unlike）— 简化 MVP；后续 V2 可加

## Specs

### SPEC-D3-L-1 — 首次点赞写入 + 计数器 +1

**GIVEN** 存在一篇 PUBLISHED post `p`（slug=`hello`），且当前 `Post.likeCount = 0`
**AND** 访客 `vh-alice` 从未对 `hello` 点过赞
**WHEN** `addLike("hello", "vh-alice")` 被调用
**THEN** `PostLike` 多出一行 `(postId=p.id, visitorHash="vh-alice")`
**AND** `Post.likeCount` 变成 `1`
**AND** 返回值满足 `{ liked: true, likeCount: 1 }`

### SPEC-D3-L-2 — 重复点赞幂等（无副作用）

**GIVEN** 访客 `vh-alice` 已对 `hello` 点过赞，当前 `Post.likeCount = 1`
**WHEN** `addLike("hello", "vh-alice")` 再次被调用
**THEN** `PostLike` 行数不变（仍 1 行）
**AND** `Post.likeCount` 仍为 `1`
**AND** 返回值满足 `{ liked: true, likeCount: 1 }`

### SPEC-D3-L-3 — 查询点赞状态

**GIVEN** 访客 `vh-alice` 已对 `hello` 点过赞，且访客 `vh-bob` 未点过
**WHEN** 分别调用 `hasLikedBy("hello", "vh-alice")` 与 `hasLikedBy("hello", "vh-bob")`
**THEN** 前者返回 `true`，后者返回 `false`

### SPEC-D3-L-4 — 未知 slug 抛 NOT_FOUND

**GIVEN** 不存在 slug=`ghost` 的 post
**WHEN** `addLike("ghost", "vh-x")` 被调用
**THEN** 抛 `AppError` 且 `code === "NOT_FOUND"`
**AND** 不产生任何 `PostLike` 行

### SPEC-D3-L-5 — `POST /api/posts/[slug]/like` 成功路径

**GIVEN** post `hello` 已 PUBLISHED
**WHEN** 客户端 `POST /api/posts/hello/like`，header 含 `user-agent`
**THEN** 响应 `200` + body `{ data: { liked: true, likeCount: <n> } }`
**AND** 服务端 visitorHash 由 `getVisitorHash(req)` 计算（IP+UA+daily salt）

### SPEC-D3-L-6 — `POST /api/posts/[slug]/like` 未知 slug → 404

**GIVEN** 不存在 slug=`ghost`
**WHEN** `POST /api/posts/ghost/like`
**THEN** 响应 `404` + body `{ error: { code: "NOT_FOUND", message: ... } }`

### SPEC-D3-L-7 — `GET /api/posts/[slug]/like` 返回当前状态

**GIVEN** post `hello` 已 PUBLISHED，`Post.likeCount = 7`，访客 vh-alice 已点过
**WHEN** vh-alice 客户端 `GET /api/posts/hello/like`
**THEN** 响应 `200` + body `{ data: { liked: true, likeCount: 7 } }`

**AND** 同请求若 visitorHash 是 vh-bob（未点过）
**THEN** 响应 body `{ data: { liked: false, likeCount: 7 } }`

### SPEC-D3-L-8 — `<LikeButton>` 初态渲染 + 点击乐观更新

**GIVEN** 详情页传入 `slug="hello"`、`initialLikeCount={3}`
**WHEN** 组件挂载并完成首次 `GET /api/posts/hello/like`（mock 返 `{ liked: false, likeCount: 3 }`）
**THEN** 按钮显示 `3`、未点态（aria-pressed="false"）

**WHEN** 用户点击按钮
**THEN** 立即乐观更新为 `4`、已点态（aria-pressed="true"，并禁用按钮防止重复点）
**AND** 后台发 `POST /api/posts/hello/like`
**AND** 收到成功后保留该状态

**WHEN** POST 返回非 2xx（例如 500）
**THEN** UI 回滚到 `3` + 未点态，展示一次错误提示（toast 或 inline）
