# Handoff — confirm-dialog-replication

> 你（接收 AI）正在执行 TZBlog 的 confirm-dialog-replication SDD。预计 1 小时。

## 30 秒概览

`PostsTable.tsx:71` 和 `ColumnsTable.tsx:122` 仍用 `window.confirm` 做删除确认 — 在 in-app browser（微信内嵌等）不工作。

复制 CommentsTable 已验证的 AlertDialog 模式（commits `c466f52` test + `593be7f` feat）到这两个表。

任务：2 个 TDD pair commit，scope `admin-posts` + `admin-columns`。

## 阅读顺序

1. `.claude/sdd/handoff-pre-deploy/master.md`
2. `.claude/sdd/handoff-pre-deploy/handoff-guide.md`
3. `.claude/sdd/handoff-pre-deploy/known-findings.md`（confirm-dialog-replication 段）
4. `.claude/sdd/confirm-dialog-replication/proposal.md`
5. `.claude/sdd/confirm-dialog-replication/specs/posts-table-dialog/spec.md`
6. `.claude/sdd/confirm-dialog-replication/specs/columns-table-dialog/spec.md`
7. `.claude/sdd/confirm-dialog-replication/test-map.md`
8. `.claude/sdd/confirm-dialog-replication/design-notes.md`
9. `.claude/sdd/confirm-dialog-replication/tasks.md`

## Reference 必读

- `src/components/admin/comments/CommentsTable.tsx`（impl 模板）
- `src/components/admin/comments/CommentsTable.test.tsx`（test 模板，第 107-160 行特别重要）
- `git show 593be7f`（看 GREEN diff 的最小改动）
- `git show c466f52`（看 RED diff 的最小测试改动）

## 执行总览

```
§0 准备（含 schema 验证 cascade 行为）

§A posts-table-dialog
   A.1.a [TEST-RED]   PostsTable.test.tsx 改测试 → 看 FAIL
                      commit: test(admin-posts): drive delete via shadcn AlertDialog interaction
   A.1.b [IMPL-GREEN] PostsTable.tsx 改实现 → 看 PASS + typecheck + lint
                      commit: feat(admin-posts): in-app AlertDialog for delete confirmation
                      hook ✓ TDD 节奏

§B columns-table-dialog
   B.1.a [TEST-RED]   ColumnsTable.test.tsx 改测试 → 看 FAIL
                      commit: test(admin-columns): drive delete via shadcn AlertDialog interaction
   B.1.b [IMPL-GREEN] ColumnsTable.tsx 改实现 → 看 PASS + typecheck + lint
                      commit: feat(admin-columns): in-app AlertDialog for delete confirmation
                      hook ✓ TDD 节奏

§C 验收
   全套 pnpm test / typecheck / lint / build
   git log 复核 4 commits
   写 completion-report.md
```

## 实施关键点

### TEST-RED 阶段必做

1. 删 `mocks.confirm` 和 `vi.stubGlobal("confirm", ...)` 和 `mocks.confirm.mockReturnValue(true)`
2. 删原 "inline delete: confirm + DELETE..." 测试
3. 加 3 个新测试（open / cancel / confirm dialog 交互）— **模板从 CommentsTable.test.tsx 抄**
4. 跑测试**看到真实 FAIL**（不是声明式）— 粘到记录

### IMPL-GREEN 阶段必做

1. import AlertDialog 系列从 `@/components/ui/alert-dialog`
2. 加 state `pendingDelete: <ItemType> | null`
3. 改删除按钮 onClick → `setPendingDelete(item)`
4. 加 `<AlertDialog open={pendingDelete !== null}>` 在组件末尾
5. 删 `window.confirm` 调用
6. ColumnsTable 特别：把 `handleDelete(id)` 重构为 `confirmDelete()`（无参，从 state 拿 item）
7. dialog description 引用 `pendingDelete?.title`（条件 render）
8. cascade 文案按 design-notes R4 模板（看 schema 决定 ColumnsTable 文案变体）

### 质量门

每个 commit 前：
- `pnpm vitest run <相关 test file>` 单文件
- 全部完成后：`pnpm typecheck && pnpm lint && pnpm test`

### Commit message 格式

```
test(admin-posts): drive delete via shadcn AlertDialog interaction

Replace single window.confirm-based test with 3 dialog interaction tests:
- click 删除 → AlertDialog opens, no DELETE fired
- 取消 → no DELETE, row stays
- 确认删除 → DELETE + row removal + toast.success

Removes vi.stubGlobal("confirm") since native confirm is no longer used.
RED at this commit: impl still uses window.confirm, dialog never renders.
```

```
feat(admin-posts): in-app AlertDialog for delete confirmation

Replace window.confirm with shadcn AlertDialog so deletion confirmation
is keyboard-accessible, styled with the theme, and works inside in-app
browsers that don't surface native confirm().

- PostsTable holds pendingDelete state instead of calling window.confirm
- Confirm action calls existing DELETE flow; cancel clears state
- Cascade message in dialog description (comments / likes / views / tags / translations)

Tests: <new total> passed (was <baseline>, +N net).
```

ColumnsTable 同款消息，scope 改 `admin-columns`，cascade message 改"翻译 / 文章归属"。

## 禁止事项

| 禁止 | 为什么 |
|------|-------|
| 抽 `<DeleteConfirmDialog>` 共享组件 | R1 决策：YAGNI |
| 改 `CommentsTable.tsx` | 已在范围外（c466f52/593be7f 已完成） |
| 改 `src/components/ui/alert-dialog.tsx` | shadcn primitive，不应改 |
| 装新依赖 | radix-ui@1.4.3 已装 |
| 改 schema / API / service | 范围外 |
| `--no-verify` | 违反 CLAUDE.md |
| getByText 用宽 regex 匹配 "确认删除" | 会 multiple elements；用 exact match（详 design-notes R5） |
| 把 handleDelete 重构散到 utils 抽象 | YAGNI |

## 完成后输出

写 `.claude/sdd/confirm-dialog-replication/completion-report.md`：

```markdown
# Completion Report — confirm-dialog-replication

## Commits
- <hash> test(admin-posts): drive delete via shadcn AlertDialog interaction
- <hash> feat(admin-posts): in-app AlertDialog for delete confirmation
- <hash> test(admin-columns): drive delete via shadcn AlertDialog interaction
- <hash> feat(admin-columns): in-app AlertDialog for delete confirmation

## Test counts
- Before: <baseline> passed | 1 skipped
- After: <after> passed | 1 skipped (+4 net)

## TypeCheck/Lint/Build
- typecheck: ✓
- lint: ✓
- test: ✓
- build: ✓

## Schema verification (R4)
- Post-Column relation onDelete: <SetNull | NoAction>
- ColumnsTable description variant chosen: <quote>

## Manual smoke needed: YES — receiving AI cannot test in-app browser; ha1den should verify on mobile webview after deploy

## Outstanding concerns
<none / list>
```

## TL;DR

```
读 SDD 文件 → 看 CommentsTable refs (c466f52 + 593be7f) → 验 schema →
§A.1.a TEST-RED (PostsTable.test.tsx 改测试 看 FAIL) → commit test(admin-posts) →
§A.1.b IMPL-GREEN (PostsTable.tsx 改实现 看 PASS) → commit feat(admin-posts) →
§B.1.a TEST-RED (ColumnsTable.test.tsx 改测试 看 FAIL) → commit test(admin-columns) →
§B.1.b IMPL-GREEN (ColumnsTable.tsx 改实现 看 PASS) → commit feat(admin-columns) →
全套 pnpm test / typecheck / lint / build → 写 completion-report.md → 停。
```

收工。
