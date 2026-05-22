import "dotenv/config";

import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("admin login a11y (SPEC-LH-A-2)", () => {
  it("Login page has no critical/serious axe violations", async () => {
    const mod = await import("@/app/(admin)/login/page");
    const LoginPage = mod.default;

    const { container } = render(<LoginPage />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
