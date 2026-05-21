# Spec — comments (D3)

> Capability: 评论提交（PENDING 默认）+ APPROVED 展示 + 1 层 reply 嵌套
> Stage: P2-D3
> SPEC-ID 前缀：`SPEC-D3-C-`

## Domain rules

- 状态机：新评论 `status = PENDING`；前台 GET 仅返 `APPROVED`；状态流转推到「评论审核页 epic」
- 计数源：`Post.commentCount`（每次插入 PENDING 即 `+1`，简化与 likeCount 一致）
- 反垃圾：rate-limit `comment:<visitorHash>` → 5 分钟内最多 3 条（hit 4+ 时返 429）
- 嵌套：D3 允许 **1 层 reply**（depth=2）
  - 顶层评论 `parentId = null`
  - reply 评论 `parentId = 顶层评论.id`，且 parent 自身必须 `parentId = null` 且 `status = APPROVED`
  - 拒绝 reply-of-reply（depth>2）
- 评论字段（schema 已落地）：`authorName`、`authorEmail`、`authorWebsite?`、`content`、`status`、`visitorHash`、`ipAddress`、`userAgent`、`parentId?`

## Specs

### SPEC-D3-C-1 — 顶层评论创建 PENDING + 计数器 +1

**GIVEN** post `hello` PUBLISHED，`Post.commentCount = 0`
**WHEN** `createComment({ slug:"hello", authorName:"A", authorEmail:"a@x.com", content:"hi", visitorHash:"vh1", ipAddress:"1.1.1.1", userAgent:"UA1" })`
**THEN** `Comment` 多一行 `(postId=p.id, status=PENDING, parentId=null, authorName="A", ...)`
**AND** `Post.commentCount` 变成 `1`
**AND** 返回值含新评论 id 与 `status: "PENDING"`

### SPEC-D3-C-2 — 含合法 parentId 的 reply 创建

**GIVEN** post `hello` 有一条 APPROVED 顶层评论 `c1`（`parentId=null`）
**WHEN** `createComment({ slug:"hello", ..., parentId: c1.id, content:"reply", visitorHash:"vh2", ... })`
**THEN** `Comment` 多一行 `(parentId=c1.id, status=PENDING, ...)`
**AND** `Post.commentCount` `+1`

### SPEC-D3-C-3 — reply-of-reply（depth>2）被拒

**GIVEN** post `hello` 有 APPROVED 顶层 `c1`，且 `c1` 下有 APPROVED reply `c2`（`parentId=c1.id`）
**WHEN** `createComment({ ..., parentId: c2.id, ... })`
**THEN** 抛 `AppError` 且 `code === "VALIDATION"`，message 含 "reply depth"
**AND** 不产生新 `Comment` 行
**AND** `Post.commentCount` 不变

### SPEC-D3-C-4 — 未知 slug 抛 NOT_FOUND

**GIVEN** 不存在 slug=`ghost` 的 post
**WHEN** `createComment({ slug:"ghost", ... })`
**THEN** 抛 `AppError` 且 `code === "NOT_FOUND"`

### SPEC-D3-C-5 — 未知 parentId 抛 NOT_FOUND

**GIVEN** post `hello` 存在，parentId `c-missing` 不存在
**WHEN** `createComment({ slug:"hello", ..., parentId:"c-missing" })`
**THEN** 抛 `AppError` 且 `code === "NOT_FOUND"`

### SPEC-D3-C-6 — `commentCreateSchema` zod 校验边界

**GIVEN** `commentCreateSchema`（slug 隐含来自 URL，body 字段：authorName/authorEmail/authorWebsite/content/parentId）
**WHEN** 校验下列 payload：
  - `authorName: ""` → 失败（min 1）
  - `authorEmail: "not-an-email"` → 失败（email）
  - `content: ""` → 失败（min 1）
  - `content: "x".repeat(1001)` → 失败（max 1000）
  - `authorWebsite: "not-a-url"` → 失败（url）
  - `authorWebsite: undefined` → 通过（optional）
  - `parentId: undefined` → 通过（optional）
  - 合法 payload → 通过
**THEN** 与上行各预期一致

### SPEC-D3-C-7 — `listApprovedComments` 返回嵌套结构

**GIVEN** post `hello` 下有：
  - `c1` APPROVED 顶层（createdAt 早）
  - `c2` APPROVED 顶层（createdAt 晚）
  - `c1r1` APPROVED reply `parentId=c1.id`
  - `c-pending` PENDING 顶层
  - `c-spam` SPAM 顶层
**WHEN** `listApprovedComments(post.id)` 被调用
**THEN** 返回结构形如：
```ts
[
  { id: c1.id, content: ..., replies: [{ id: c1r1.id, content: ..., replies: [] }] },
  { id: c2.id, content: ..., replies: [] }
]
```
**AND** 顶层按 `createdAt asc` 排
**AND** 不含 `c-pending` 与 `c-spam`

### SPEC-D3-C-8 — `POST /api/posts/[slug]/comments` rate-limit 5min/3

**GIVEN** post `hello` PUBLISHED，rate-limit store 干净
**WHEN** 同一 visitorHash 连续 4 次 `POST /api/posts/hello/comments`
**THEN** 前 3 次返 `201` + 创建 PENDING
**AND** 第 4 次返 `429` + `{ error: { code: "RATE_LIMITED", message: ... } }`
**AND** 第 4 次未在 DB 产生 Comment 行

### SPEC-D3-C-9 — `GET /api/posts/[slug]/comments` 仅 APPROVED + 嵌套

**GIVEN** post `hello` 下有 1 个 APPROVED 顶层 + 1 个 PENDING 顶层 + 1 个 APPROVED reply
**WHEN** 客户端 `GET /api/posts/hello/comments`
**THEN** 响应 `200` + body `{ data: { comments: [{ id, replies: [{ id, ... }] }] } }`
**AND** PENDING 不出现

### SPEC-D3-C-10 — `<CommentForm>` 提交成功后 UX

**GIVEN** 渲染 `<CommentForm slug="hello" parentId={null} />`
**WHEN** 用户填写合法字段并点击提交
**THEN** 表单显示加载态
**AND** 收到 `201` 响应后清空表单
**AND** 显示「评论已提交，等待审核」一次性 banner

**WHEN** 收到 `429` 响应
**THEN** 显示「评论太频繁，请稍后再试」错误

**WHEN** 收到其他 4xx/5xx
**THEN** 显示 fallback 错误文案

### SPEC-D3-C-11 — `<CommentList>` 渲染顶层 + reply 缩进

**GIVEN** props.comments = `[{ id:"c1", content:"top", replies:[{id:"c1r1", content:"r", replies:[]}] }, { id:"c2", content:"top2", replies:[] }]`
**WHEN** 组件渲染
**THEN** 顶层评论按数组顺序展示
**AND** `c1` 下方缩进展示 `c1r1`（`pl-8` 或类似的视觉缩进）
**AND** 每条顶层评论下方有一个「回复」按钮，点击展开 reply form（`parentId=c1.id`）
**AND** reply 评论本身**不**再有「回复」按钮

### SPEC-D3-C-12 — PostDetailPage 接入

**GIVEN** post `hello` PUBLISHED，下有 1 条 APPROVED 评论 + 2 条 PENDING
**WHEN** 访问 `/posts/hello`
**THEN** 详情页 line 112 的 `likes N` 数字位置换成 `<LikeButton>`
**AND** article 末尾有 `<CommentSection>` 包含已审核的 1 条评论与 `<CommentForm>`
**AND** 不出现 PENDING 评论
