# design-notes — confirm-dialog-replication

## R1：独立 per-component vs 共享 `<DeleteConfirmDialog>` 抽象

**选**：独立（每个 component 内联 AlertDialog）

**理由**：
- **YAGNI**：3 处同款（CommentsTable + PostsTable + ColumnsTable）不痛。共享抽象要传 `item / title / description / onConfirm / variant / cascadeMessage` 至少 6 个 prop，对每个 caller 添加心智负担
- **CommentsTable 也是内联**（commit `593be7f`），保持一致；如果将来出现第 4-5 个同款，再抽
- **可读性**：每个表内部看到自己的 dialog，不需要跳转到共享文件理解状态
- **测试隔离**：每个 component 的 dialog 测试只测自己，不需要 mock 共享组件

**反方观点**（不采纳）：
- "DRY 啊，3 处复制太多" — Rule of three (Beck) 的实际写法是"等出现第 3 处再考虑抽象"，但 3 处和 4-5 处对抽象的需求强度差别巨大。3 处属于"可控复制"
- "如果将来 dialog 改 description 文案就 3 处都得改" — description 已经因 cascade 内容**不同**而必然不同（Posts 含评论点赞浏览；Columns 含翻译归属），共享反而更难

## R2：AlertDialog button variant 选择

**选**：`<AlertDialogAction variant="destructive">`

**理由**：
- 与 CommentsTable 一致（c466f52 验证）
- `Button` component 的 `destructive` variant 已有红色样式（参考 `src/components/ui/button.tsx`）：`bg-destructive text-destructive-fg hover:bg-destructive/90`
- 与 Radix AlertDialog 的"破坏性操作"语义匹配

## R3：测试改造策略

**选**：移除 `confirm` mock，新增 3 个 dialog 交互测试

**理由**：
- 测试覆盖**真实路径**（实际 dialog 渲染 + 用户点击交互）
- 移除 `window.confirm` mock 后，测试不会因 jsdom 默认行为产生 false positive
- 3 测试拆分（open / cancel / confirm）覆盖所有状态转换

**实施细节**：
- 测试模板直接复制 `CommentsTable.test.tsx:107-160` 改改名字
- 注意 cancel 测试需用 `getByRole("button", { name: /^取消$/ })` 而非 `/取消/`（避免匹配 description 中的"取消"字样如果出现）
- description match 用 exact text 或具体片段，避免泛 regex 匹配多个 element

## R4：dialog description 含 cascade 详情

**选**：含详情

**理由**：
- admin 是严肃语境，用户明确知道删了什么减少误操作
- cascade 字样让 ha1den 上线后 review 时能确认 dialog 描述与实际 schema 行为一致

**Post 删除 description 模板**：
```
将删除文章「<title>」。
级联删除：所有评论 / 点赞 / 浏览记录 / 标签关联 / 翻译。
该操作不可恢复。
```

**Column 删除 description 模板（按 schema 行为）**：

| Post-Column 关系定义 | description |
|---|---|
| `onDelete: SetNull` | "将删除专栏「<title>」。级联删除：所有翻译。专栏下的文章将变为无专栏归属（columnId 置 null）。该操作不可恢复。" |
| 无 onDelete（默认 NoAction/Restrict） | "将删除专栏「<title>」。级联删除：所有翻译。⚠️ 若该专栏下有文章，删除可能失败（请先迁移文章）。该操作不可恢复。" |

§0.4 任务要求实施 AI 先验证 schema 状态再选模板。

## R5：AlertDialog vs Dialog

**选**：AlertDialog

**理由**：
- Radix AlertDialog 内置 `role="alertdialog"` ARIA 属性 — 屏幕阅读器明确播报"alert dialog"
- 默认 Escape key 关闭 + focus trap + outside click 关闭（按需禁用）
- 语义清晰：AlertDialog 用于"破坏性 / 不可恢复"操作，Dialog 用于通用模态

## ColumnsTable 的 handleDelete 签名改动

当前：`async function handleDelete(id: string)` (line 119)

改后：`async function confirmDelete()`（不带参数），但需要在 onClick 之前 `setPendingDelete(item)`（item 是 ColumnListItem 对象）。

**为什么**：
- dialog description 需要 column.title，不能只有 id
- 与 PostsTable / CommentsTable 模式一致

**实施步骤**：
1. 行内 delete button 的 onClick：`() => setPendingDelete(row)` 而非 `() => handleDelete(row.id)`
2. 新增 `confirmDelete()` 函数（无参），开头 `const item = pendingDelete; if (!item) return; setPendingDelete(null);` 然后用 `item.id` 做 fetch
3. AlertDialogAction onClick={confirmDelete}

## Radix Portal 在 jsdom 的行为

CommentsTable 测试已跑通，证明：
- `screen.getByRole("alertdialog")` 能找到 Portal 渲染的 dialog 内容（screen 查的是整个 document）
- `userEvent.click` 在 portal 内的按钮也能触发

不需要额外 polyfill。如果出现 `Element.prototype.hasPointerCapture is not a function` 类报错，参考 Radix 文档加 jsdom polyfill 到 `vitest.setup.ts`（但 CommentsTable 没遇到，应该不需要）。

## description regex 陷阱

当前 PostsTable 测试可能用 `getByText(/确认删除/)` 类宽 regex。新模式下 dialog 含：
- `<AlertDialogTitle>确认删除文章</AlertDialogTitle>` （ColumnsTable 是"确认删除专栏"）
- `<AlertDialogAction>确认删除</AlertDialogAction>`

两者都含"确认删除"字样 → `getByText(/确认删除/)` 抛 "multiple elements"。

**对策**：用 exact match
- title 验证：`screen.getByText("确认删除文章")` (exact) 或 `getByRole("heading", { name: /确认删除文章/ })`
- button 点击：`getByRole("button", { name: /^确认删除$/ })` (exact via `^...$`)

CommentsTable test commit `593be7f` 就因为这个踩过坑（参考 c466f52 的修正）。

## Hook 节奏

每 component 必走 RED commit → GREEN commit 顺序：
1. `test(admin-posts):` — RED
2. `feat(admin-posts):` — GREEN，hook 检查前 5 commit 必有 test(admin-posts)，应通过
3. `test(admin-columns):` — RED
4. `feat(admin-columns):` — GREEN，hook 检查前 5 commit（包含上一组）必有 test(admin-columns)，应通过

如果 hook 拒绝（"未发现同 scope test"），通常是：
- scope 拼错（如写成 `admin-post` 单数）
- commit 顺序倒了（feat 在 test 前）— 此时 `git reset --soft HEAD~N` + 重新按顺序 commit

## 不要做的事

- 不要装 Framer Motion 或其他动画库（AlertDialog 自带 enter/exit 动画）
- 不要改 `src/components/ui/alert-dialog.tsx` 本身
- 不要给 Comments / Tags / Media 的其他 admin 组件加 dialog（除非 grep 发现也用 confirm 且 ha1den 同意扩范围）
- 不要把 dialog 抽成共享组件（R1 决策）
- 不要 `git commit --no-verify`
