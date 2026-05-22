# specs/posts-table-dialog — PostsTable AlertDialog 替换

> spec-id 前缀：`SPEC-CDR-PT`
> Reference impl：`src/components/admin/comments/CommentsTable.tsx`（commit `593be7f`）

## Background

当前 `src/components/admin/posts/PostsTable.tsx:70-71` 代码：

```tsx
async function handleDelete(post: PostListItem) {
  const ok = window.confirm(
    `确认删除「${post.title}」？该操作不可恢复，将级联删除评论、点赞、浏览记录。`,
  )
  if (!ok) return
  // ... 实际 DELETE flow
}
```

测试 setup（`PostsTable.test.tsx`）含 `vi.stubGlobal("confirm", mocks.confirm)` + `mocks.confirm.mockReturnValue(true)`。

替换方案：CommentsTable 已验证的 pendingDelete + AlertDialog 受控模式。

---

## SPEC-CDR-PT-1 — 点击"删除"按钮打开 AlertDialog，不触发 DELETE

```gherkin
GIVEN PostsTable 渲染 1 个 PostListItem（任意 status）
  AND fetch mock 干净（mocks.fetch.mockReset()）

WHEN 用户点击该行的"删除"按钮（getByRole("button", { name: /^删除$/ })）

THEN screen.getByRole("alertdialog") 应存在
  AND dialog 应含标题 "确认删除文章"
  AND dialog 应含描述提及级联（"评论 / 点赞 / 浏览记录" 字样）
  AND dialog 应含 post.title（让用户知道删的哪一条）
  AND mocks.fetch 不被调用（dialog 仅打开，未确认）
  AND 该行仍存在于 DOM（不应乐观隐藏）
```

---

## SPEC-CDR-PT-2 — AlertDialog 取消按钮：关闭对话框且不触发 DELETE

```gherkin
GIVEN AlertDialog 已通过 SPEC-CDR-PT-1 打开

WHEN 用户点击"取消"按钮（getByRole("button", { name: /^取消$/ })）

THEN AlertDialog 应关闭（queryByRole("alertdialog") 返回 null）
  AND mocks.fetch 不被调用
  AND 该行仍存在于 DOM
  AND pendingDelete state 重置为 null（可通过下次点击删除按钮重新打开验证）
```

---

## SPEC-CDR-PT-3 — AlertDialog 确认按钮：触发 DELETE + 乐观移除 + toast

```gherkin
GIVEN AlertDialog 已通过 SPEC-CDR-PT-1 打开
  AND mocks.fetch.mockResolvedValue(new Response("{}", { status: 200 }))

WHEN 用户点击"确认删除"按钮（getByRole("button", { name: /^确认删除$/ }))

THEN mocks.fetch 应被调用 with:
  - URL: "/api/admin/posts/<post.id>"
  - method: "DELETE"

AND（DELETE 成功后）：
  - 该行从 DOM 移除（queryByText(post.title) 返回 null）
  - mocks.toastSuccess 被调用 with "已删除" 类似消息
  - AlertDialog 关闭
```

---

## SPEC-CDR-PT-4 — Description 含 cascade 详情

```gherkin
GIVEN AlertDialog 已通过 SPEC-CDR-PT-1 打开

WHEN inspecting dialog description

THEN description 文案应至少包含：
  - "评论" 字样
  - "点赞" 字样
  - "浏览记录" 字样
  - "不可恢复" 或同义警告
  - 文章标题（post.title）

DOM example:
  <AlertDialogDescription>
    将删除文章「<post.title>」。
    级联删除：所有评论 / 点赞 / 浏览记录 / 标签关联 / 翻译。
    该操作不可恢复。
  </AlertDialogDescription>
```

---

## Acceptance（每个 spec）

- 测试断言用 `screen.getByRole("alertdialog")` / `getByText` / `getByRole("button", { name })`
- 测试 mock 模式：`vi.stubGlobal("fetch", ...)` + `vi.mock("sonner", ...)` + `vi.mock("next/navigation", ...)`（CommentsTable.test.tsx 模板）
- **不再** stub `window.confirm`（移除 `vi.stubGlobal("confirm", ...)` 和相关 `mocks.confirm`）

## Cascade 信息来源（schema）

| 关系 | onDelete |
|------|---------|
| PostTranslation.post → Post | Cascade |
| Comment.post → Post | Cascade |
| PostLike.post → Post | Cascade |
| PostView.post → Post | Cascade |
| TagsOnPosts.post → Post | Cascade |

所以删除一个 Post 会级联清掉所有翻译、评论、点赞、浏览记录、标签关联。Description 文案应反映这点。
