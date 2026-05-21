import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CommentForm } from "./CommentForm"

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("fetch", mocks.fetch)
})

function makeResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

async function fillForm(): Promise<void> {
  await userEvent.type(screen.getByLabelText(/昵称/), "Alice")
  await userEvent.type(screen.getByLabelText(/邮箱/), "alice@example.com")
  await userEvent.type(screen.getByLabelText(/内容/), "great post!")
}

describe("<CommentForm /> SPEC-D3-C-10", () => {
  it("on submit success: POSTs to /api/posts/[slug]/comments, shows 等待审核 banner, clears form", async () => {
    mocks.fetch.mockResolvedValueOnce(
      makeResponse(201, { data: { id: "c1", status: "PENDING" } }),
    )

    render(<CommentForm slug="hello" />)
    await fillForm()
    await userEvent.click(screen.getByRole("button", { name: /提交/ }))

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/posts/hello/comments",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      )
    })

    await waitFor(() =>
      expect(screen.getByText(/评论已提交，等待审核/)).toBeInTheDocument(),
    )

    expect((screen.getByLabelText(/内容/) as HTMLTextAreaElement).value).toBe(
      "",
    )
  })

  it("on 429 RATE_LIMITED: shows 评论太频繁 error", async () => {
    mocks.fetch.mockResolvedValueOnce(
      makeResponse(429, {
        error: { code: "RATE_LIMITED", message: "rate" },
      }),
    )

    render(<CommentForm slug="hello" />)
    await fillForm()
    await userEvent.click(screen.getByRole("button", { name: /提交/ }))

    await waitFor(() =>
      expect(screen.getByText(/评论太频繁/)).toBeInTheDocument(),
    )

    // 表单内容保留（rate-limit 不算用户错误）
    expect((screen.getByLabelText(/内容/) as HTMLTextAreaElement).value).toBe(
      "great post!",
    )
  })

  it("on other error (500): shows fallback error", async () => {
    mocks.fetch.mockResolvedValueOnce(
      makeResponse(500, {
        error: { code: "INTERNAL_ERROR", message: "boom" },
      }),
    )

    render(<CommentForm slug="hello" />)
    await fillForm()
    await userEvent.click(screen.getByRole("button", { name: /提交/ }))

    await waitFor(() =>
      expect(screen.getByText(/提交失败|出错|请稍后再试/)).toBeInTheDocument(),
    )
  })

  it("reply mode: body includes parentId and onSuccess fires after 201", async () => {
    mocks.fetch.mockResolvedValueOnce(
      makeResponse(201, { data: { id: "c2", status: "PENDING" } }),
    )
    const onSuccess = vi.fn()

    render(<CommentForm slug="hello" parentId="parent-1" onSuccess={onSuccess} />)
    await fillForm()
    await userEvent.click(screen.getByRole("button", { name: /提交/ }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))

    const lastCall = mocks.fetch.mock.calls.at(-1)
    expect(lastCall).toBeDefined()
    const sentBody = JSON.parse(
      (lastCall![1] as { body: string }).body,
    ) as Record<string, unknown>
    expect(sentBody.parentId).toBe("parent-1")
  })
})
