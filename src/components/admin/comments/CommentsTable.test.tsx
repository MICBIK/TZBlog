import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AdminCommentListItem } from "@/lib/services/comments"
import { CommentsTable } from "./CommentsTable"

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
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
  vi.stubGlobal("confirm", mocks.confirm)
  vi.stubGlobal("fetch", mocks.fetch)
  mocks.confirm.mockReturnValue(true)
  mocks.fetch.mockResolvedValue(new Response("{}", { status: 200 }))
})

function makeItem(
  id: string,
  status: AdminCommentListItem["status"] = "PENDING",
  authorName = "Alice",
  content = "hello world",
): AdminCommentListItem {
  return {
    id,
    authorName,
    authorEmail: "a@x.com",
    authorWebsite: null,
    content,
    status,
    parentId: null,
    visitorHash: "v",
    ipAddress: "1.1.1.1",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    post: { slug: "hello", title: "你好" },
  }
}

describe("<CommentsTable /> SPEC-C-U-2 + U-3", () => {
  it("renders rows with authorName + content truncated + post info", () => {
    render(
      <CommentsTable
        initialItems={[makeItem("c1", "PENDING")]}
        total={1}
        page={1}
        pageSize={20}
      />,
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText(/hello world/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "你好" })).toBeInTheDocument()
  })

  it("inline 通过 button fires PATCH + optimistic status change + toast.success", async () => {
    let resolveFetch!: (value: Response) => void
    mocks.fetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve
      }),
    )

    render(
      <CommentsTable
        initialItems={[makeItem("c1", "PENDING")]}
        total={1}
        page={1}
        pageSize={20}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /^通过$/ }))

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/admin/comments/c1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "APPROVED" }),
        }),
      )
    })

    resolveFetch(new Response('{"data":{}}', { status: 200 }))

    await waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalled()
    })
  })

  it("inline delete: confirm + DELETE + row removal + toast.success", async () => {
    render(
      <CommentsTable
        initialItems={[makeItem("c1", "PENDING")]}
        total={1}
        page={1}
        pageSize={20}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /^删除$/ }))

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/admin/comments/c1",
        expect.objectContaining({ method: "DELETE" }),
      )
    })

    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeInTheDocument()
    })

    expect(mocks.toastSuccess).toHaveBeenCalled()
  })

  it("multi-select + BulkActions: shows count, bulk approve fires POST /bulk", async () => {
    render(
      <CommentsTable
        initialItems={[
          makeItem("c1", "PENDING"),
          makeItem("c2", "PENDING", "Bob"),
        ]}
        total={2}
        page={1}
        pageSize={20}
      />,
    )

    // 初始没有 BulkActions
    expect(screen.queryByText(/已选/)).toBeNull()

    const checkboxes = screen.getAllByRole("checkbox", { name: /select-row/ })
    await userEvent.click(checkboxes[0])
    await userEvent.click(checkboxes[1])

    expect(screen.getByText(/已选 2 条/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /^批量通过$/ }))

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/admin/comments/bulk",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ ids: ["c1", "c2"], status: "APPROVED" }),
        }),
      )
    })
  })

  it("PATCH failure rolls back optimistic status + toast.error", async () => {
    let resolveFetch!: (value: Response) => void
    mocks.fetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve
      }),
    )

    render(
      <CommentsTable
        initialItems={[makeItem("c1", "PENDING")]}
        total={1}
        page={1}
        pageSize={20}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /^通过$/ }))

    // 触发失败
    resolveFetch(new Response("{}", { status: 500 }))

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalled()
    })
  })
})
