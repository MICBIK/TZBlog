import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AdminCommentListItem } from "@/lib/services/comments"
import CommentsAdminPage from "./page"

const mocks = vi.hoisted(() => ({
  listCommentsForAdmin: vi.fn(),
}))

vi.mock("@/lib/services/comments", () => ({
  listCommentsForAdmin: mocks.listCommentsForAdmin,
}))

vi.mock("@/components/admin/comments/CommentsTable", () => ({
  CommentsTable: ({
    initialItems,
    total,
    page,
    pageSize,
  }: {
    initialItems: AdminCommentListItem[]
    total: number
    page: number
    pageSize: number
  }) => (
    <div
      data-testid="mock-comments-table"
      data-total={String(total)}
      data-page={String(page)}
      data-page-size={String(pageSize)}
      data-items-count={String(initialItems.length)}
    />
  ),
}))

function makeItem(id: string, status: AdminCommentListItem["status"]): AdminCommentListItem {
  return {
    id,
    authorName: `A-${id}`,
    authorEmail: `a-${id}@x.com`,
    authorWebsite: null,
    content: `content ${id}`,
    status,
    parentId: null,
    visitorHash: "v",
    ipAddress: "0.0.0.0",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    post: { slug: "hello", title: "你好" },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // 默认 mock：4 status 各自计数 + 当前页拿 PENDING 1 条
  mocks.listCommentsForAdmin.mockImplementation(
    async (filter: { status?: AdminCommentListItem["status"] }) => {
      if (!filter.status) {
        return {
          items: [makeItem("c1", "PENDING")],
          total: 4,
          page: 1,
          pageSize: 20,
        }
      }
      const counts = { PENDING: 1, APPROVED: 2, SPAM: 1, REJECTED: 0 } as const
      return {
        items: [],
        total: counts[filter.status],
        page: 1,
        pageSize: 20,
      }
    },
  )
})

describe("<CommentsAdminPage /> SPEC-C-U-1", () => {
  it("renders 4 status tabs with counts as links", async () => {
    const page = await CommentsAdminPage({
      searchParams: Promise.resolve({}),
    })
    render(page)

    const pendingLink = screen.getByRole("link", { name: /待审核|待审/ })
    expect(pendingLink).toHaveAttribute(
      "href",
      expect.stringContaining("status=PENDING"),
    )

    const approvedLink = screen.getByRole("link", { name: /已通过/ })
    expect(approvedLink).toHaveAttribute(
      "href",
      expect.stringContaining("status=APPROVED"),
    )

    expect(screen.getByRole("link", { name: /垃圾/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /已拒/ })).toBeInTheDocument()

    // counts: PENDING=1, APPROVED=2, SPAM=1, REJECTED=0
    expect(pendingLink.textContent).toMatch(/1/)
    expect(approvedLink.textContent).toMatch(/2/)
  })

  it("passes filtered list props to CommentsTable", async () => {
    const page = await CommentsAdminPage({
      searchParams: Promise.resolve({ status: "PENDING" }),
    })
    render(page)

    const table = screen.getByTestId("mock-comments-table")
    expect(table).toHaveAttribute("data-page", "1")
    expect(table).toHaveAttribute("data-page-size", "20")
    // listCommentsForAdmin 被调时 status 应被传递
    const filterCalls = mocks.listCommentsForAdmin.mock.calls
    const passedStatuses = filterCalls
      .map((c) => (c[0] as { status?: string }).status)
      .filter((s): s is string => Boolean(s))
    expect(passedStatuses).toContain("PENDING")
  })
})
