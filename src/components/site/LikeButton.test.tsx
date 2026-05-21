import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LikeButton } from "./LikeButton"

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
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

describe("<LikeButton /> SPEC-D3-L-8", () => {
  it("mount: fetches GET /like and reflects initial state in UI", async () => {
    mocks.fetch.mockResolvedValueOnce(
      makeResponse(200, { data: { liked: false, likeCount: 3 } }),
    )

    render(<LikeButton slug="hello" initialLikeCount={3} />)

    // 立刻显示 initialLikeCount=3 + 未点态
    const btn = screen.getByRole("button")
    expect(btn).toHaveAttribute("aria-pressed", "false")
    expect(btn).toHaveTextContent("3")

    // mount 时打 GET
    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/posts/hello/like",
        expect.objectContaining({ method: "GET" }),
      )
    })
  })

  it("optimistic increment on click + keeps state on POST success", async () => {
    mocks.fetch
      .mockResolvedValueOnce(
        makeResponse(200, { data: { liked: false, likeCount: 3 } }),
      )
      .mockResolvedValueOnce(
        makeResponse(200, { data: { liked: true, likeCount: 4 } }),
      )

    render(<LikeButton slug="hello" initialLikeCount={3} />)

    const btn = screen.getByRole("button")
    await waitFor(() =>
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/posts/hello/like",
        expect.objectContaining({ method: "GET" }),
      ),
    )

    await userEvent.click(btn)

    // 乐观更新：count=4 + 已点态 + 按钮禁用（防重复点）
    expect(btn).toHaveTextContent("4")
    expect(btn).toHaveAttribute("aria-pressed", "true")
    expect(btn).toBeDisabled()

    // 后台 POST 已发
    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/posts/hello/like",
        expect.objectContaining({ method: "POST" }),
      )
    })

    // 成功后保留状态
    await waitFor(() => expect(btn).toHaveTextContent("4"))
    expect(btn).toHaveAttribute("aria-pressed", "true")
  })

  it("rolls back to previous state + toast.error on POST failure", async () => {
    // mount GET 立即 resolve
    mocks.fetch.mockResolvedValueOnce(
      makeResponse(200, { data: { liked: false, likeCount: 3 } }),
    )

    // POST 用 deferred Promise 控制时序，让乐观断言先成立再回滚
    let resolvePost!: (value: Response) => void
    mocks.fetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolvePost = resolve
      }),
    )

    render(<LikeButton slug="hello" initialLikeCount={3} />)

    const btn = screen.getByRole("button")
    await waitFor(() =>
      expect(mocks.fetch).toHaveBeenCalledWith(
        "/api/posts/hello/like",
        expect.objectContaining({ method: "GET" }),
      ),
    )

    await userEvent.click(btn)

    // 乐观先升到 4（POST 还没 resolve）
    expect(btn).toHaveTextContent("4")
    expect(btn).toHaveAttribute("aria-pressed", "true")

    // 触发失败响应
    resolvePost(
      makeResponse(500, {
        error: { code: "INTERNAL_ERROR", message: "boom" },
      }),
    )

    // POST 500 后回滚
    await waitFor(() => expect(btn).toHaveAttribute("aria-pressed", "false"))
    expect(btn).toHaveTextContent("3")
    expect(mocks.toastError).toHaveBeenCalledTimes(1)
  })
})
