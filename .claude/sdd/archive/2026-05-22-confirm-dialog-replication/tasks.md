# tasks.md — confirm-dialog-replication

> 微循环结构：1 component = 1 micro-cycle (TEST-RED + IMPL-GREEN pair)
> 阶段前缀 `[CDR]`
> commit scope 约定：`admin-posts` / `admin-columns`
> Reference impl: `src/components/admin/comments/CommentsTable.tsx` (commit `593be7f`)

## §0 准备

- [ ] §0.1 阅读 context：
  - `.claude/sdd/handoff-pre-deploy/master.md`
  - `.claude/sdd/handoff-pre-deploy/handoff-guide.md`
  - `.claude/sdd/handoff-pre-deploy/known-findings.md`（confirm-dialog-replication 段）
  - `.claude/sdd/confirm-dialog-replication/proposal.md`
  - `.claude/sdd/confirm-dialog-replication/specs/*/spec.md`
  - `.claude/sdd/confirm-dialog-replication/test-map.md`
  - `.claude/sdd/confirm-dialog-replication/design-notes.md`

- [ ] §0.2 阅读 reference：
  - `src/components/admin/comments/CommentsTable.tsx`（impl 模式）
  - `src/components/admin/comments/CommentsTable.test.tsx`（test 模式）
  - 看 commits `c466f52` (test) + `593be7f` (impl) 的 diff（`git show 593be7f`）了解最小改动

- [ ] §0.3 验证依赖：
  - `ls src/components/ui/alert-dialog.tsx`（应存在）
  - `grep "@radix-ui\|radix-ui" package.json`（确认 `radix-ui@1.4.3` 已装）

- [ ] §0.4 验证 schema cascade（for description 文案）：
  - `grep -A3 "model Post " prisma/schema.prisma`
  - `grep -A20 "model Post " prisma/schema.prisma | grep -E "column|@relation"`
  - 记录 Post-Column 关系是否含 `onDelete: SetNull` 或其他（写到 design-notes 后续可参考）

## §A [CDR] posts-table-dialog

### A.1 [SPEC-CDR-PT-1..4] PostsTable AlertDialog 替换

#### A.1.a [TEST-RED] 改 `PostsTable.test.tsx`

- [ ] A.1.a.1 删除 `mocks.confirm` (in `vi.hoisted`)
- [ ] A.1.a.2 删除 `beforeEach` 中的 `vi.stubGlobal("confirm", mocks.confirm)` + `mocks.confirm.mockReturnValue(true)`
- [ ] A.1.a.3 删除现有 "inline delete: confirm + DELETE..." 之类的测试函数
- [ ] A.1.a.4 新增 3 个测试：
  - `inline delete: click 删除 opens AlertDialog without firing DELETE`
  - `inline delete: AlertDialog 取消 → no DELETE + row stays`
  - `inline delete: AlertDialog 确认删除 → DELETE + row removal + toast.success`
  - 测试模板参考 `src/components/admin/comments/CommentsTable.test.tsx` 第 107-160 行
- [ ] A.1.a.5 跑 `pnpm vitest run src/components/admin/posts/PostsTable.test.tsx`
- [ ] A.1.a.6 **必须看到** 3 个新测试 FAIL（"alertdialog 找不到" / "取消按钮找不到" / "确认删除按钮找不到"）；其他原测试应 PASS
- [ ] A.1.a.7 粘 FAIL 输出到 completion-report.md 或本任务记录
- [ ] A.1.a.8 `git add src/components/admin/posts/PostsTable.test.tsx`
- [ ] A.1.a.9 `git commit -m "test(admin-posts): drive delete via shadcn AlertDialog interaction"`

#### A.1.b [IMPL-GREEN] 改 `PostsTable.tsx`

- [ ] A.1.b.1 在 file top 导入 AlertDialog 系列：
  ```tsx
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
  ```
- [ ] A.1.b.2 在 component 顶部加 state：`const [pendingDelete, setPendingDelete] = useState<PostListItem | null>(null)`
- [ ] A.1.b.3 改 `handleDelete(post: PostListItem)` 拆为两步：
  - 删除按钮的 onClick 改成 `() => setPendingDelete(row)`
  - 新增 `async function confirmDelete()` 含原 handleDelete 的实际 fetch DELETE 逻辑（先 `const item = pendingDelete; if (!item) return; setPendingDelete(null);` 然后用 item 跑剩下的）
- [ ] A.1.b.4 在组件 return 末尾（在最外 `</div>` 之前）加 AlertDialog JSX：
  ```tsx
  <AlertDialog
    open={pendingDelete !== null}
    onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认删除文章</AlertDialogTitle>
        <AlertDialogDescription>
          {pendingDelete
            ? `将删除文章「${pendingDelete.title}」。级联删除：所有评论 / 点赞 / 浏览记录 / 标签关联 / 翻译。该操作不可恢复。`
            : ""}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction variant="destructive" onClick={confirmDelete}>
          确认删除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  ```
- [ ] A.1.b.5 删除 `window.confirm(...)` 调用（line 71 原文）
- [ ] A.1.b.6 跑 `pnpm vitest run src/components/admin/posts/PostsTable.test.tsx`
- [ ] A.1.b.7 **必须看到** 全套 PASS（原 7 个 + 新 3 个 = 10 个测试 PASS）
- [ ] A.1.b.8 跑 `pnpm typecheck` — 全绿
- [ ] A.1.b.9 跑 `pnpm lint` — 全绿
- [ ] A.1.b.10 粘 PASS 输出
- [ ] A.1.b.11 `git add src/components/admin/posts/PostsTable.tsx`
- [ ] A.1.b.12 `git commit -m "feat(admin-posts): in-app AlertDialog for delete confirmation"`
  - hook 必须输出 `✓ TDD 节奏检查通过：feat(admin-posts) 前有对应 test(admin-posts)`

## §B [CDR] columns-table-dialog

### B.1 [SPEC-CDR-CT-1..4] ColumnsTable AlertDialog 替换

#### B.1.a [TEST-RED] 改 `ColumnsTable.test.tsx`

- [ ] B.1.a.1 ~ B.1.a.9 同 A.1.a 步骤（针对 ColumnsTable 文件）
- commit: `test(admin-columns): drive delete via shadcn AlertDialog interaction`

#### B.1.b [IMPL-GREEN] 改 `ColumnsTable.tsx`

- [ ] B.1.b.1 ~ B.1.b.12 同 A.1.b 步骤
- 注意 1：`handleDelete(id: string)` 签名要改成 `(item: ColumnListItem)` 以便 dialog description 能引用 `item.title`
- 注意 2：AlertDialog description 文案改为"将删除专栏「<title>」。级联删除：所有翻译。专栏下的文章将变为无专栏归属（如 schema 是 SetNull）/ 删除会失败（如 Restrict）。该操作不可恢复。" — 按 §0.4 schema 验证结果选确切措辞
- commit: `feat(admin-columns): in-app AlertDialog for delete confirmation`

## §C 集成验收

- [ ] C.1 全套测试：`pnpm test`，预期 +4 specs（原基线 354 → 358）
- [ ] C.2 typecheck + lint：`pnpm typecheck && pnpm lint` 全绿
- [ ] C.3 build：`pnpm build` 全绿（一般不会回归，但稳妥起见跑一次）
- [ ] C.4 `git log -4 --oneline` 复核 — 应见 4 个新 commits：
  ```
  feat(admin-columns): ...
  test(admin-columns): ...
  feat(admin-posts): ...
  test(admin-posts): ...
  ```
- [ ] C.5 写 completion-report.md

## §D 不归档（由审计 AI 决定）

- [ ] D.1 **不**自动 `git mv .claude/sdd/confirm-dialog-replication` 到 archive
- [ ] D.2 **不**自动跑 `/project:finish-feature`
- [ ] D.3 **不**修改 memory-bank/activeContext.md
