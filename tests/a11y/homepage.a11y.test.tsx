import "dotenv/config";

import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

expect.extend(toHaveNoViolations);

vi.mock("next/font/google", () => {
  const fontStub = () => ({ variable: "--font-stub" });
  return {
    Geist: fontStub,
    Geist_Mono: fontStub,
    Inter: fontStub,
    Source_Serif_4: fontStub,
  };
});

const mocks = vi.hoisted(() => ({
  getCurrentLocale: vi.fn(),
  getSiteStats: vi.fn(),
  listPosts: vi.fn(),
}));

vi.mock("@/lib/i18n", () => ({
  getCurrentLocale: mocks.getCurrentLocale,
  DEFAULT_LOCALE: "zh",
}));

vi.mock("@/lib/services/posts", () => ({
  listPosts: mocks.listPosts,
}));

vi.mock("@/lib/services/stats", () => ({
  getSiteStats: mocks.getSiteStats,
}));

vi.mock("@/components/site/GithubCard", () => ({
  GithubCard: () => (
    <section data-testid="github-card-stub" aria-label="GitHub activity">
      <h2>GITHUB · DEVELOPMENT</h2>
    </section>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.getSiteStats.mockResolvedValue({ views: 0, posts: 0, comments: 0 });
  mocks.listPosts.mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 3,
  });
});

describe("homepage a11y (SPEC-LH-A-1)", () => {
  it("HomePage has no critical/serious axe violations", async () => {
    const { default: HomePage } = await import("@/app/(site)/page");
    const { container } = render(await HomePage());

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
