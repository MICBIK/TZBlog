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
    <section aria-labelledby="github-card-heading">
      <h2 id="github-card-heading">GitHub Activity</h2>
    </section>
  ),
}));

vi.mock("@/components/site/HomeHero", () => ({
  HomeHero: () => (
    <section aria-labelledby="home-hero-heading">
      <h1 id="home-hero-heading">个人写作，工程实现，克制表达。</h1>
      <a href="/posts">阅读文章</a>
      <a href="/about">关于我</a>
    </section>
  ),
}));

vi.mock("@/components/site/HomeFeaturedAndRecent", () => ({
  HomeFeaturedAndRecent: () => (
    <section aria-labelledby="home-featured-heading">
      <h2 id="home-featured-heading">最新文章</h2>
      <a href="/posts">所有文章 →</a>
    </section>
  ),
}));

vi.mock("@/components/site/HomeColumns", () => ({
  HomeColumns: () => (
    <section aria-labelledby="home-columns-heading">
      <h2 id="home-columns-heading">专栏</h2>
      <a href="/columns">全部专栏 →</a>
    </section>
  ),
}));

vi.mock("@/components/site/HomePrinciples", () => ({
  HomePrinciples: () => (
    <section aria-labelledby="home-principles-heading">
      <h2 id="home-principles-heading">原则</h2>
    </section>
  ),
}));

vi.mock("@/components/site/TechStack", () => ({
  TechStack: () => (
    <section aria-labelledby="tech-stack-heading">
      <h2 id="tech-stack-heading">技术体系</h2>
      <a href="/about#tech-stack">完整技术选型理由 →</a>
    </section>
  ),
}));

vi.mock("@/components/site/HomeStats", () => ({
  HomeStats: () => (
    <section aria-label="站点状态">
      v0.x · 12 posts · 84 views in 7 days · last shipped May 2026
    </section>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.getSiteStats.mockResolvedValue({
    views: 0,
    viewsInLast7Days: 0,
    posts: 0,
    comments: 0,
    lastShippedAt: null,
  });
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
