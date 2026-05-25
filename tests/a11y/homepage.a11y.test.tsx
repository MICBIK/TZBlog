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
  getHomePageData: vi.fn(),
}));

vi.mock("@/lib/i18n", () => ({
  getCurrentLocale: mocks.getCurrentLocale,
  DEFAULT_LOCALE: "zh",
}));

vi.mock("@/lib/services/homePage", () => ({
  getHomePageData: mocks.getHomePageData,
}));

vi.mock("@/components/theme/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.getHomePageData.mockResolvedValue({
    hero: {
      tagline: "个人写作，工程实现，克制表达。",
      subtitle: "TZBlog",
    },
    channels: [
      {
        id: "channel-articles",
        slug: "articles",
        kind: "ARTICLES",
        layout: "CHRONICLE",
        name: "文章",
        description: "长文与复盘",
        tagline: "slow writing",
        entries: [
          {
            id: "entry-1",
            slug: "why-i-rewrote-my-blog",
            title: "为什么我重做了自己的博客",
            excerpt: "Channel/Entry 元模型",
            href: "/posts/why-i-rewrote-my-blog",
          },
        ],
      },
    ],
    trending: [
      {
        slug: "why-i-rewrote-my-blog",
        title: "为什么我重做了自己的博客",
        href: "/posts/why-i-rewrote-my-blog",
      },
    ],
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
