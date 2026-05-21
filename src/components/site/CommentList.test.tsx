import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { CommentNode } from "@/lib/services/comments"
import { CommentList } from "./CommentList"

vi.mock("./CommentForm", () => ({
  CommentForm: ({
    slug,
    parentId,
  }: {
    slug: string
    parentId?: string
    onSuccess?: () => void
  }) => (
    <div
      data-testid="mock-comment-form"
      data-slug={slug}
      data-parent-id={parentId ?? ""}
    />
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const comments: CommentNode[] = [
  {
    id: "c1",
    authorName: "Top1",
    authorWebsite: null,
    content: "top first",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    replies: [
      {
        id: "c1r1",
        authorName: "Reply1",
        authorWebsite: null,
        content: "reply to top1",
        createdAt: new Date("2026-01-01T12:00:00Z"),
        replies: [],
      },
    ],
  },
  {
    id: "c2",
    authorName: "Top2",
    authorWebsite: null,
    content: "top second",
    createdAt: new Date("2026-01-02T00:00:00Z"),
    replies: [],
  },
]

describe("<CommentList /> SPEC-D3-C-11", () => {
  it("renders top-level comments in array order", () => {
    render(<CommentList comments={comments} slug="hello" />)
    const orderedTops = ["top first", "top second"].map(
      (txt) => screen.getByText(txt).textContent,
    )
    expect(orderedTops).toEqual(["top first", "top second"])
  })

  it("renders reply nested under parent with indent class (pl-8)", () => {
    render(<CommentList comments={comments} slug="hello" />)
    const reply = screen.getByText("reply to top1")
    const container = reply.closest("[data-comment-reply]")
    expect(container).not.toBeNull()
    expect(container).toHaveClass("pl-8")
  })

  it("each top-level comment has a 「回复」 button; replies have none", () => {
    render(<CommentList comments={comments} slug="hello" />)

    const replyButtons = screen.getAllByRole("button", { name: /回复/ })
    expect(replyButtons).toHaveLength(2)

    const reply = screen.getByText("reply to top1").closest("[data-comment-reply]")
    expect(reply!.querySelector("button")).toBeNull()
  })

  it("clicking 回复 toggles CommentForm with the right parentId", async () => {
    render(<CommentList comments={comments} slug="hello" />)

    expect(screen.queryByTestId("mock-comment-form")).toBeNull()

    const c1ReplyBtn = screen.getAllByRole("button", { name: /回复/ })[0]
    await userEvent.click(c1ReplyBtn)

    const form = await screen.findByTestId("mock-comment-form")
    expect(form).toHaveAttribute("data-parent-id", "c1")
    expect(form).toHaveAttribute("data-slug", "hello")
  })
})
