# Proposal — comments-and-likes (D3)

> Stage: P2 前台展示 D3 — 评论区 + 点赞
> Created: 2026-05-21
> Path: `.claude/sdd/comments-and-likes/`

## Why

P2-D 文章详情已落地 D1（首页接真实数据 + cover）和 D2（TOC 侧栏），剩下 D3 = 让访客在文章页能 **点赞 / 评论**。前台展示链条至此闭环。

- `Post.likeCount` 与 `Post.commentCount` 内嵌计数器已就位但**永远是 0**（没有写入路径）。
- 详情页 `page.tsx:111-113` 已渲染 `views N / likes N / comments N` 三个数字，等组件替换。
- Prisma `PostLike` (`@@unique [postId, visitorHash]`) + `Comment` (含 `status: CommentStatus`, `parentId`) schema 已在 P0 落地。
- 反垃圾基础设施已就绪：`lib/visitor.ts#getVisitorHash` 含 daily salt，`lib/rate-limit.ts` in-memory token bucket。

## What

D3 范围（一次性闭环）：

### Capability: likes（永久 unique 一次性点赞）
- 服务层 `addLike(slug, visitorHash)` / `hasLikedBy(slug, visitorHash)`
- API `POST/GET /api/posts/[slug]/like`
- UI `<LikeButton>` 客户端组件（mount 拉初态 / 点击乐观更新 / 错误回滚）
- 详情页接入：替换 line 112 的 `likes N` 数字

### Capability: comments（PENDING 默认 + 1 层 reply）
- 服务层 `createComment(input)` / `listApprovedComments(postId)`（嵌套 depth=2）
- API `POST/GET /api/posts/[slug]/comments`（POST 走 rate-limit 5min/3 by visitorHash）
- zod schema `commentCreateSchema`（authorName 必填 / authorEmail email / content 1-1000 / authorWebsite optional url / parentId optional）
- UI `<CommentSection>`（server）+ `<CommentList>`（server, 含 reply 嵌套）+ `<CommentForm>`（client, react-hook-form + zod）
- 详情页接入：article 末尾挂 `<CommentSection postId={post.id} slug={post.slug} />`

### 不在 D3 范围（推迟）
- **评论审核 UI**（admin 端 PENDING/APPROVED/SPAM/REJECTED 列表 + 批量动作）→ 下一个 epic（C 评论审核页，progress.md 已列）
- **honeypot field** 防机器人 → V2 安全增强
- **reply >1 层嵌套** → V2（schema parentId 字段保留，先用单层）
- **评论邮件通知**（被回复时邮件）→ V2

## Decisions made before kicking off

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | CLAUDE.md "点赞 24h 滚动" vs schema `@@unique([postId, visitorHash])` 永久 | **永久 unique** | 一篇文章一票更符合直觉；schema 不动；CLAUDE.md 那一行需后续同步改为"永久" |
| R2 | reply 嵌套深度 | **D3 含 1 层（depth=2）** | 主流博客实践，schema parentId 已支持；2 层以上递归 UI 复杂度推 V2 |
| R3 | honeypot vs rate-limit | **D3 只做 rate-limit** | 5min/3 已足以挡基础机器人；honeypot 推 V2 |
| R4 | rate-limit 内存 vs Redis | **保留内存版** | 单 VPS 单 Node 实例，无共享需求；扩多实例时再换 |
| R5 | commentCount 计 APPROVED 还是 PENDING+APPROVED | **计 PENDING+APPROVED（即所有插入即 +1）** | 简单一致，与 likeCount 模式对齐；审核 reject 时再 -1（推到审核页 epic 处理） |

## Capabilities 摘要

| capability | spec 文件 | 范围 |
|---|---|---|
| likes | `specs/likes/spec.md` | 服务层 + API + UI + 详情页接入 |
| comments | `specs/comments/spec.md` | 服务层 + API + UI + 嵌套 reply + 详情页接入 |

## Impact

- 新建：~10 文件（services / schemas / api routes / 4 个 UI 组件 + 测试）
- 修改：`(site)/posts/[slug]/page.tsx` + `page.test.tsx`
- 不动 Prisma schema（已就绪）
- 不动 `.env` / `.env.example`
- 不装新依赖（react-hook-form / zod / @hookform/resolvers 已在 admin 表单用过）

## Out of scope

- 评论审核页（admin 端 list + 批量审核）
- 评论邮件通知
- 评论 ≥2 层 reply
- 点赞用户列表展示
- 点赞 / 评论的 Analytics 上报（与 PostView 一致的 Beacon 推 V2）

## Workflow

按 P2-E 教训，本 SDD **不再追溯补齐**：
1. 本 proposal.md + specs/{likes,comments}/spec.md + test-map.md + tasks.md 一次性建好提交（`docs(sdd): comments-and-likes scaffold [no-tdd]`）
2. 后续每个微循环走 `test(<scope>):` → `feat(<scope>):` 双 commit 节奏
3. scope 建议：`likes-service` / `likes-api` / `like-button` / `comments-service` / `comments-api` / `comment-form` / `comment-list` / `post-detail-d3`
