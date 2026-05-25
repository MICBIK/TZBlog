# Spec 13 · Guestbook

> 私密留言板：访客邮箱 magic link 登录后留言，仅本人 + admin 可见；扁平 conversation 结构。
>
> Reference: `design-notes.md` Q7 / `channel-meta-cms.md` §8.4 / `magic-link-auth.md`

---

## Specs

### 入口 `/guestbook`

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| gb-001 | 未登录用户 | 访问 `/guestbook` | 200，显示介绍 + 邮箱 magic link 登录表单 |
| gb-002 | VISITOR 已登录但无 thread | 访问 | 显示"开始新对话"表单 + 历史空状态 |
| gb-003 | VISITOR 已登录 + 有 thread | 访问 | 显示自己的 thread（含所有 messages） + admin 回复 |
| gb-004 | ADMIN 已登录 | 访问 | 显示所有 VISITOR 的 threads 列表（可点击进入查看） |

### Thread 操作

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| gb-005 | VISITOR 已登录无 thread | 提交"开始对话"表单 | POST `/api/guestbook/threads`，创建 `Entry { kind: GUESTBOOK_THREAD, channelId: <guestbook>, authorId: <visitor> }`，content=初始留言 |
| gb-006 | VISITOR 已登录 + 有 thread | 提交 reply 表单 | POST `/api/guestbook/comments`，创建 `Comment { entryId: <thread>, authorUserId: <visitor>, visibility: PRIVATE_TO_THREAD }` |
| gb-007 | ADMIN 已登录 | 在 visitor thread 内提交 reply | 同上，但 authorUserId=admin |
| gb-008 | 第三方 VISITOR_B 已登录 | 访问 VISITOR_A 的 thread URL | 403 / 404 |
| gb-009 | ADMIN 已登录 | 标记 thread 为 RESOLVED（可选） | UPDATE Entry.metadata.resolved=true |

### 反垃圾

| Spec-ID | GIVEN | WHEN | THEN |
|---------|-------|------|------|
| gb-010 | VISITOR 5 分钟内发 4 条 message | 第 4 条提交 | 返回 429 + 显示频控提示 |
| gb-011 | VISITOR thread 字符长度 > 2000 | 提交 | 返回 400 + 显示长度限制 |

---

## Test File

- `src/app/(site)/guestbook/page.test.tsx`
- `src/app/api/guestbook/threads/route.test.ts`
- `src/app/api/guestbook/comments/route.test.ts`
- `src/components/guestbook/ThreadView.test.tsx`

---

## Acceptance

- [ ] 11 spec 全 pass
- [ ] HaiDen 自己 visit `/guestbook` → magic link 流程 → 发一条 message → admin 后台看到
- [ ] 第三方 VISITOR 看不到他人 thread（隐私验证）

---

## Don't

- 不做嵌套 reply tree（parentId 永远 null）
- 不通知评论邮件（V2）
- 不暴露 `/c/guestbook` 路径
- 不让游客（未登录）发言

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T13:40:00Z -->
