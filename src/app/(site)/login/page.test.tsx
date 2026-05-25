import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const signInMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

import LoginPage from "./page";

describe("LoginPage auth-magic", () => {
  it("rendersVisitorAndAdminForms", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "访客登录" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "管理员入口" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "获取登录链接" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
  });

  it("visitorSubmitCallsSignInEmailAndShowsGenericSuccess", async () => {
    signInMock.mockResolvedValueOnce({ ok: true, error: null });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getAllByLabelText("邮箱")[0]!, "visitor@example.com");
    await user.click(screen.getByRole("button", { name: "获取登录链接" }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("email", {
        email: "visitor@example.com",
        redirect: false,
      });
    });

    expect(
      screen.getByText("如该邮箱有效，登录链接已发送"),
    ).toBeInTheDocument();
  });

  it("visitorSubmitShowsRateLimitMessage", async () => {
    signInMock.mockResolvedValueOnce({ ok: false, error: "RateLimited" });
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getAllByLabelText("邮箱")[0]!, "limited@example.com");
    await user.click(screen.getByRole("button", { name: "获取登录链接" }));

    await waitFor(() => {
      expect(screen.getByText("请求过多，请稍后再试")).toBeInTheDocument();
    });
  });
});
