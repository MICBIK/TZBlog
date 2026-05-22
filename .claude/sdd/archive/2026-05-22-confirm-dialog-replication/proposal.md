# Proposal — confirm-dialog-replication

> Stage: Pre-deploy housekeeping
> Created: 2026-05-22
> Path: `.claude/sdd/confirm-dialog-replication/`
> Tier: T2 / 1h implementation

## Why

P1-C admin-comments-review smoke 阶段（2026-05-22）发现 `window.confirm` 在 in-app browser 中无法工作，已为 `CommentsTable` 用 shadcn `<AlertDialog>` 替换（commits `c466f52` test RED + `593be7f` feat GREEN，hook ✓ TDD 节奏）。

但是同样的 `window.confirm` 模式还存在于：

- `src/components/admin/posts/PostsTable.tsx:71`
- `src/components/admin/columns/ColumnsTable.tsx:122`

任何在 in-app browser（如微信 / Slack 内嵌 / 移动 webview）打开 admin 的人尝试删除文章 / 专栏时，删除按钮会"静默无反应"（因为 `window.confirm` 返回 undefined / 抛错被吞）。

不修这层，UX 限制会跟随 ha1den 上线后第一次手机微信打开 admin 的尝试一起被发现。

## What

两个 capability（独立，无依赖）：

### Capability: posts-table-dialog
- 把 `src/components/admin/posts/PostsTable.tsx:71` 的 `window.confirm(...)` 替换为 shadcn `<AlertDialog>` 受控模式
- State: `pendingDelete: PostListItem | null`
- Delete button onClick → `setPendingDelete(post)`
- `<AlertDialog open={pendingDelete !== null} onOpenChange={...}>` 渲染在组件末尾
- `<AlertDialogAction variant="destructive" onClick={confirmDelete}>` 触发实际 DELETE flow
- `AlertDialogDescription` 写明 cascade 后果（translations / comments / likes / views / tag 关联）

### Capability: columns-table-dialog
- 同样的模式应用到 `src/components/admin/columns/ColumnsTable.tsx:122`
- State: `pendingDelete: ColumnListItem | null`（或对应类型）
- `AlertDialogDescription` 写明：删除会级联 translations；专栏下文章会变为 columnId null（无专栏归属）

### 不在范围
- 不抽 `<DeleteConfirmDialog>` 共享组件（YAGNI；CommentsTable 也是内联，3 处同款代码可接受）
- 不改 `CommentsTable.tsx`（已在 c466f52/593be7f 完成）
- 不改其他 admin tables（如未来有 TagsTable、MediaTable，等到出现同样需求再改）
- 不改 API / service 层（DELETE 路径不变）
- 不改 schema

## Decisions

| # | 矛盾 / 备选 | 决策 | Reason |
|---|---|---|---|
| R1 | 独立 per-component vs 抽 `<DeleteConfirmDialog>` 共享 | **独立** | YAGNI；3 处同款代码不痛；抽象会强制传 N 个 prop（item / title / description / onConfirm / cascade message / variant）；CommentsTable 也是内联 |
| R2 | AlertDialog variant 选哪个？ | **`<AlertDialogAction variant="destructive">`** | 与 CommentsTable 一致；Button `destructive` variant 已有红色样式（`bg-destructive text-destructive-fg`）|
| R3 | 测试模式：保留 confirm mock 还是改 dialog 交互？ | **改 dialog 交互**，移除 `vi.stubGlobal("confirm")` | 测试覆盖真实路径；与 CommentsTable.test.tsx 模式一致 |
| R4 | dialog description 含 cascade 细节 vs 只说"不可恢复" | **含 cascade 细节** | 用户友好（明确知道删了什么）；与 admin 严肃语境匹配 |
| R5 | 用 `AlertDialog` 还是 `Dialog`？ | **`AlertDialog`** | AlertDialog 语义就是"破坏性确认"，Radix 内置了适当 ARIA（alertdialog role）+ Escape 关闭等；Dialog 是通用模态 |

## Capabilities 摘要

| capability | spec 文件 | spec-id 范围 |
|---|---|---|
| posts-table-dialog | `specs/posts-table-dialog/spec.md` | SPEC-CDR-PT-1..4 |
| columns-table-dialog | `specs/columns-table-dialog/spec.md` | SPEC-CDR-CT-1..4 |

## Impact

- 修改：
  - `src/components/admin/posts/PostsTable.tsx`（替换 window.confirm + 新增 AlertDialog JSX + state）
  - `src/components/admin/posts/PostsTable.test.tsx`（移除 confirm mock + 新增 3 个 dialog 交互测试）
  - `src/components/admin/columns/ColumnsTable.tsx`（同上）
  - `src/components/admin/columns/ColumnsTable.test.tsx`（同上）
- 新增：无新组件文件（AlertDialog 已在 `src/components/ui/alert-dialog.tsx`，CommentsTable 阶段已装）
- 依赖：无新装（`radix-ui@1.4.3` 已就位）
- 测试预期增量：每个 component 测试文件 +2 net specs（原 1 个 confirm 测试 → 3 个 dialog 测试 = +2）。两个 component 合计 +4 specs

## Out of scope

- 抽共享 `<DeleteConfirmDialog>` 组件（YAGNI；改到第 4 处同款时再考虑）
- 修改 `<MediaCard>` / `<MediaRowActions>` / `<CoverUploader>` 等含 confirm 的其他 admin 组件（除非 grep 发现也用 `window.confirm`；本任务范围只 Posts + Columns）
- 修改 API 路由 / service 层
- 装新依赖 / 改 globals.css

## Workflow

1. SDD 7 件套一次性建好（本任务的元数据）
2. **§A posts-table-dialog**:
   - A.1 [TEST-RED] `test(admin-posts): drive delete via AlertDialog interaction`
   - A.2 [IMPL-GREEN] `feat(admin-posts): in-app AlertDialog for delete confirmation` （hook ✓ TDD 节奏检查 — 前 5 commit 必有同 scope test:）
3. **§B columns-table-dialog**:
   - B.1 [TEST-RED] `test(admin-columns): drive delete via AlertDialog interaction`
   - B.2 [IMPL-GREEN] `feat(admin-columns): in-app AlertDialog for delete confirmation`
4. 跑质量门：`pnpm typecheck && pnpm lint && pnpm test`
5. 写 completion-report.md
6. **不**自动 `/project:finish-feature`（claude 审计阶段统一做）

## Risks

| 风险 | 缓解 |
|------|------|
| Radix AlertDialog 在 jsdom 需 polyfill | CommentsTable 测试已跑通（无需额外 polyfill）；同款模式不应触发新问题 |
| `getByText(/确认删除/)` 匹配多个（title + button）| 用 exact match `getByText("确认删除文章")` / `getByText("确认删除")`（按钮）；参考 CommentsTable 测试经验 |
| Radix Portal 使 dialog 不在 React 树内 | `screen.*` query 走 document.body；CommentsTable 验证可行 |
| 改完后 PostsTable 已有的 7 个测试回归 | tasks.md 强制全套 `pnpm test` 复跑 |
| 误删 confirm mock 后 setup 仍 reference `mocks.confirm` | tasks.md 列出 mock cleanup 步骤 |
