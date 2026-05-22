# specs/columns-table-dialog — ColumnsTable AlertDialog 替换

> spec-id 前缀：`SPEC-CDR-CT`
> Reference impl：`src/components/admin/comments/CommentsTable.tsx`（commit `593be7f`）

## Background

当前 `src/components/admin/columns/ColumnsTable.tsx:119-122` 代码：

```tsx
async function handleDelete(id: string) {
  // ...
  const ok = window.confirm(
    `确认删除该专栏？该操作不可恢复。`,  // 实际文案可能略不同
  )
  if (!ok) return
  // ... 实际 DELETE flow
}
```

测试 setup（`ColumnsTable.test.tsx`）含类似 `vi.stubGlobal("confirm", ...)` 模式。

替换方案：CommentsTable 已验证的 pendingDelete + AlertDialog 受控模式。

注意：ColumnsTable handleDelete 签名是 `(id: string)` 而非 `(item: ColumnListItem)`。实现 AI 应改成 `(item: ColumnListItem)` 模式以便 dialog description 能展示 column.title 字样（参考 PostsTable / CommentsTable 风格）。

---

## SPEC-CDR-CT-1 — 点击"删除"按钮打开 AlertDialog，不触发 DELETE

```gherkin
GIVEN ColumnsTable 渲染 1 个 ColumnListItem
  AND fetch mock 干净（mocks.fetch.mockReset()）

WHEN 用户点击该行的"删除"按钮（getByRole("button", { name: /^删除$/ }))

THEN screen.getByRole("alertdialog") 应存在
  AND dialog 含标题 "确认删除专栏"
  AND dialog 含描述提及级联（"翻译 / 文章归属" 字样）
  AND dialog 含 column.title（让用户知道删的哪一条）
  AND mocks.fetch 不被调用
  AND 该行仍存在于 DOM
```

---

## SPEC-CDR-CT-2 — AlertDialog 取消按钮：关闭对话框且不触发 DELETE

```gherkin
GIVEN AlertDialog 已通过 SPEC-CDR-CT-1 打开

WHEN 用户点击"取消"按钮（getByRole("button", { name: /^取消$/ })）

THEN AlertDialog 应关闭
  AND mocks.fetch 不被调用
  AND 该行仍存在于 DOM
  AND pendingDelete state 重置为 null
```

---

## SPEC-CDR-CT-3 — AlertDialog 确认按钮：触发 DELETE + 乐观移除 + toast

```gherkin
GIVEN AlertDialog 已通过 SPEC-CDR-CT-1 打开
  AND mocks.fetch.mockResolvedValue(new Response("{}", { status: 200 }))

WHEN 用户点击"确认删除"按钮（getByRole("button", { name: /^确认删除$/ }))

THEN mocks.fetch 应被调用 with:
  - URL: "/api/admin/columns/<column.id>"
  - method: "DELETE"

AND（DELETE 成功后）：
  - 该行从 DOM 移除
  - mocks.toastSuccess 被调用 with "已删除" 类似消息
  - AlertDialog 关闭
```

---

## SPEC-CDR-CT-4 — Description 含 cascade 详情

```gherkin
GIVEN AlertDialog 已通过 SPEC-CDR-CT-1 打开

WHEN inspecting dialog description

THEN description 文案应至少包含：
  - "翻译" 字样（指 ColumnTranslation 级联）
  - "文章" 字样 + 说明这些文章会变为 "无专栏归属" 或 "columnId 置 null" 类似措辞
  - "不可恢复" 或同义警告
  - 专栏名称（column.title）

DOM example:
  <AlertDialogDescription>
    将删除专栏「<column.title>」。
    级联删除：所有翻译。专栏下的文章将变为无专栏归属（columnId 置 null）。
    该操作不可恢复。
  </AlertDialogDescription>
```

---

## Cascade 信息来源（schema）

| 关系 | onDelete |
|------|---------|
| ColumnTranslation.column → Column | Cascade |
| Post.column → Column? | （未指定 onDelete，且 columnId 是 nullable）— Prisma 默认通常会拒绝（NoAction / Restrict）或留 orphan |

⚠️ **实施 AI 注意**：在写 Description 之前 verify Post-Column 关系的删除行为：
1. 查 `prisma/schema.prisma`：`model Post` 的 `column Column?` 关系定义是否有 `onDelete: SetNull`
2. 如果是 SetNull → description 说"专栏下的文章将变为无专栏归属"
3. 如果是默认（NoAction/Restrict）→ description 说"如该专栏下有文章，删除会失败"
4. 如果不确定，写一段中性文案 + 在 `design-notes.md` 记录待 verify

## Acceptance（每个 spec）

- 测试断言模式同 PostsTable
- 移除 `vi.stubGlobal("confirm", ...)` 和 `mocks.confirm`
- 改 `handleDelete(id)` 签名为 `handleDelete(item)` （否则 dialog description 拿不到 title）
