# test-map.md — confirm-dialog-replication

> spec-id → test 函数 + 文件路径 + 层级

## posts-table-dialog

| spec-id | 测试函数名 | 文件 | 层级 |
|---|---|---|---|
| SPEC-CDR-PT-1 | `inline delete: click 删除 opens AlertDialog without firing DELETE` | `src/components/admin/posts/PostsTable.test.tsx` | jsdom |
| SPEC-CDR-PT-2 | `inline delete: AlertDialog 取消 → no DELETE + row stays` | 同上 | jsdom |
| SPEC-CDR-PT-3 | `inline delete: AlertDialog 确认删除 → DELETE + row removal + toast.success` | 同上 | jsdom |
| SPEC-CDR-PT-4 | （含在 SPEC-CDR-PT-1 内 — 同时断言 dialog description 含 cascade 字样 + post.title） | 同上 | jsdom |

> SPEC-CDR-PT-4 不需要单独测试函数；在 PT-1 测试内同时断言 description 含"评论/点赞/浏览记录/不可恢复/post.title"足够。

## columns-table-dialog

| spec-id | 测试函数名 | 文件 | 层级 |
|---|---|---|---|
| SPEC-CDR-CT-1 | `inline delete: click 删除 opens AlertDialog without firing DELETE` | `src/components/admin/columns/ColumnsTable.test.tsx` | jsdom |
| SPEC-CDR-CT-2 | `inline delete: AlertDialog 取消 → no DELETE + row stays` | 同上 | jsdom |
| SPEC-CDR-CT-3 | `inline delete: AlertDialog 确认删除 → DELETE + row removal + toast.success` | 同上 | jsdom |
| SPEC-CDR-CT-4 | （含在 SPEC-CDR-CT-1 内 — 同时断言 dialog description 含"翻译 / 文章 / 不可恢复 / column.title"） | 同上 | jsdom |

## 测试 setup 模板（参考 CommentsTable.test.tsx）

```ts
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}))

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("fetch", mocks.fetch)
  mocks.fetch.mockResolvedValue(new Response("{}", { status: 200 }))
})
```

**注意**：与现有 PostsTable.test.tsx / ColumnsTable.test.tsx 相比，移除：
- `confirm: vi.fn()` from `vi.hoisted` mocks
- `vi.stubGlobal("confirm", mocks.confirm)` from beforeEach
- `mocks.confirm.mockReturnValue(true)` from beforeEach

## 现有测试的回归保证

PostsTable.test.tsx 当前含 8 个测试（per progress.md:65）。本任务改 1 个 delete 测试（变 3 个 dialog 测试 = +2 net）。其他 7 个测试（empty / Badge / 标签折叠 / 乐观发布 + 回滚 / 分页边界）必须仍 PASS。

ColumnsTable.test.tsx 含若干测试（具体数从 grep 验证）。同上：本任务只动 delete 测试，其他必须 PASS。

## 回归命令

```bash
# 单文件
pnpm vitest run src/components/admin/posts/PostsTable.test.tsx
pnpm vitest run src/components/admin/columns/ColumnsTable.test.tsx

# 全套（最终验收）
pnpm test
```

## 类型 / lint 验证

```bash
pnpm typecheck
pnpm lint
```

新增 import `AlertDialog` 系列从 `@/components/ui/alert-dialog`，TypeScript 应无报错（参考 CommentsTable 已成功使用的 import shape）。
