import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  signIn: vi.fn(),
}));

import LoginPage from "./page";

describe("LoginPage i18n chrome", () => {
  it("renders Chinese form chrome for the single-locale admin", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { level: 1, name: "登录" })).toBeInTheDocument();
    expect(screen.getByText("访问 TZBlog 后台管理。")).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
    expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
    expect(screen.queryByText("Email")).not.toBeInTheDocument();
    expect(screen.queryByText("Password")).not.toBeInTheDocument();
  });
});
