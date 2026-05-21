# test-map.md — comments-and-likes

> spec-id → 测试函数 + 文件路径 + 层级（unit / integration / jsdom）
> 涉及 Server Action / API 的 spec 必须有 zod schema 校验测试条目（CLAUDE.md TDD 铁律 #2）
> 详情页 page.test.tsx 已存在，D3 在其中追加 case

## likes

| spec-id | 测试函数（it / describe 描述） | 文件 | 层级 |
|---|---|---|---|
| SPEC-D3-L-1 | `addLike first time creates row + increments likeCount + returns {liked:true, likeCount:1}` | `src/lib/services/likes.test.ts` | integration |
| SPEC-D3-L-2 | `addLike is idempotent on duplicate visitorHash` | `src/lib/services/likes.test.ts` | integration |
| SPEC-D3-L-3 | `hasLikedBy returns true/false correctly` | `src/lib/services/likes.test.ts` | integration |
| SPEC-D3-L-4 | `addLike throws NOT_FOUND when slug missing` | `src/lib/services/likes.test.ts` | integration |
| SPEC-D3-L-5 | `POST /api/posts/[slug]/like returns 200 + {liked, likeCount}` | `src/app/api/posts/[slug]/like/route.test.ts` | integration |
| SPEC-D3-L-6 | `POST /api/posts/[slug]/like → 404 on missing slug` | `src/app/api/posts/[slug]/like/route.test.ts` | integration |
| SPEC-D3-L-7 | `GET /api/posts/[slug]/like returns current state per visitor` | `src/app/api/posts/[slug]/like/route.test.ts` | integration |
| SPEC-D3-L-8 | `<LikeButton /> mount-fetch + optimistic click + rollback on error` | `src/components/site/LikeButton.test.tsx` | jsdom |

## comments

| spec-id | 测试函数（it / describe 描述） | 文件 | 层级 |
|---|---|---|---|
| SPEC-D3-C-1 | `createComment top-level inserts PENDING + commentCount +1` | `src/lib/services/comments.test.ts` | integration |
| SPEC-D3-C-2 | `createComment with valid parentId creates depth-2 reply` | `src/lib/services/comments.test.ts` | integration |
| SPEC-D3-C-3 | `createComment rejects reply-of-reply (depth > 2)` | `src/lib/services/comments.test.ts` | integration |
| SPEC-D3-C-4 | `createComment throws NOT_FOUND on missing slug` | `src/lib/services/comments.test.ts` | integration |
| SPEC-D3-C-5 | `createComment throws NOT_FOUND on missing parentId` | `src/lib/services/comments.test.ts` | integration |
| SPEC-D3-C-6 | `commentCreateSchema 边界（authorName/email/content/website/parentId）` | `src/lib/schemas/comment.test.ts` | unit (zod) |
| SPEC-D3-C-7 | `listApprovedComments returns nested APPROVED only, top sorted asc` | `src/lib/services/comments.test.ts` | integration |
| SPEC-D3-C-8 | `POST /api/posts/[slug]/comments rate-limits 5min/3 by visitorHash` | `src/app/api/posts/[slug]/comments/route.test.ts` | integration |
| SPEC-D3-C-9 | `GET /api/posts/[slug]/comments returns APPROVED-only nested` | `src/app/api/posts/[slug]/comments/route.test.ts` | integration |
| SPEC-D3-C-10 | `<CommentForm /> submit success/429/error UX` | `src/components/site/CommentForm.test.tsx` | jsdom |
| SPEC-D3-C-11 | `<CommentList /> renders top + 1 layer reply with indent + reply button only on top` | `src/components/site/CommentList.test.tsx` | jsdom |
| SPEC-D3-C-12 | `PostDetailPage embeds LikeButton + CommentSection, hides PENDING` | `src/app/(site)/posts/[slug]/page.test.tsx` | jsdom (追加 case) |

## helper / shared

| 项 | 文件 | 说明 |
|---|---|---|
| zod schema 校验 | `src/lib/schemas/comment.test.ts` | SPEC-D3-C-6 边界全测；新文件 |
| 详情页接入 | `src/app/(site)/posts/[slug]/page.test.tsx` | 追加 SPEC-D3-C-12，已有文件 |

## 备注

- 所有 integration 层用 dev Postgres（port 5433）+ `tests/helpers/db.ts#resetAll / ensureTestUser`，与 P0 既有约定一致
- API 层测试 mock visitorHash（直接调 route handler 用伪造 Request，对 `getVisitorHash` 注入 IP/UA）
- jsdom 层用 `@testing-library/react` + `vi.fn` mock `fetch`
- 不引入新依赖
