import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "./page";

const mocks = vi.hoisted(() => ({
  getCurrentLocale: vi.fn(),
  getSiteStats: vi.fn(),
  listPosts: vi.fn(),
}));

vi.mock("@/lib/i18n", () => ({
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/posts", () => ({
  listPosts: mocks.listPosts,
}));

vi.mock("@/lib/services/stats", () => ({
  getSiteStats: mocks.getSiteStats,
}));

vi.mock("@/components/site/HeroEditorial", () => ({
  HeroEditorial: () => (
    <section data-testid="hero-editorial-stub">
      <h1>Building things, one commit at a time.</h1>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/posts">Read Blog →</a>
      <a href="/about">About →</a>
    </section>
  ),
}));

vi.mock("@/components/site/LaunchNarrative", () => ({
  LaunchNarrative: () => (
    <section data-testid="launch-narrative-stub">
      <h2>A self-hosted publishing system, built in public.</h2>
    </section>
  ),
}));

vi.mock("@/components/site/HomeHero", () => ({
  HomeHero: () => (
    <section data-testid="home-hero-section">
      <h1>个人写作，工程实现，克制表达。</h1>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/posts">阅读文章</a>
      <a href="/about">关于我</a>
    </section>
  ),
}));

vi.mock("@/components/site/HomeFeaturedAndRecent", () => ({
  HomeFeaturedAndRecent: () => (
    <section data-testid="home-featured-recent-section">
      <h2>最新文章</h2>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/posts">所有文章 →</a>
    </section>
  ),
}));

vi.mock("@/components/site/HomeColumns", () => ({
  HomeColumns: () => (
    <section data-testid="home-columns-section">
      <h2>专栏</h2>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/columns">全部专栏 →</a>
    </section>
  ),
}));

vi.mock("@/components/site/HomePrinciples", () => ({
  HomePrinciples: () => (
    <section data-testid="home-principles-section">
      <h2>原则</h2>
    </section>
  ),
}));

vi.mock("@/components/site/TechStack", () => ({
  TechStack: () => (
    <section data-testid="home-tech-stack-section">
      <h2>技术体系</h2>
      <a href="/about#tech-stack">完整技术选型理由 →</a>
    </section>
  ),
}));

vi.mock("@/components/site/GithubCard", () => ({
  GithubCard: () => (
    <section data-testid="github-card-section">
      <h2>GitHub Activity</h2>
    </section>
  ),
}));

vi.mock("@/components/site/HomeStats", () => ({
  HomeStats: () => (
    <section data-testid="home-stats-section">
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

describe("HomePage composition", () => {
  it("rendersIdentityRailAndContentStream", async () => {
    render(await HomePage());

    const identityRail = screen.getByRole("complementary", {
      name: "作者身份",
    });
    const contentStream = screen.getByRole("main", {
      name: "首页内容流",
    });

    expect(identityRail).toHaveAttribute("data-home-identity-rail");
    expect(contentStream).toHaveAttribute("data-home-content-stream");
    expect(screen.getByText("当前状态")).toBeInTheDocument();
    expect(screen.getByTestId("home-featured-recent-section")).toBeInTheDocument();
    expect(screen.getByTestId("home-columns-section")).toBeInTheDocument();
    expect(screen.getByTestId("github-card-section")).toBeInTheDocument();
    expect(screen.getByTestId("home-stats-section")).toBeInTheDocument();

    expect(
      identityRail.compareDocumentPosition(contentStream) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders 7 sections in order", async () => {
    render(await HomePage());

    const orderedSections = [
      screen.getByTestId("home-hero-section"),
      screen.getByTestId("home-featured-recent-section"),
      screen.getByTestId("home-columns-section"),
      screen.getByTestId("home-principles-section"),
      screen.getByTestId("home-tech-stack-section"),
      screen.getByTestId("github-card-section"),
      screen.getByTestId("home-stats-section"),
    ];

    for (let index = 0; index < orderedSections.length - 1; index += 1) {
      expect(
        orderedSections[index].compareDocumentPosition(orderedSections[index + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("does not import or render LaunchNarrative on home page", async () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/(site)/page.tsx"),
      "utf8",
    );

    expect(source).not.toContain("LaunchNarrative");

    render(await HomePage());

    expect(screen.queryByTestId("launch-narrative-stub")).not.toBeInTheDocument();
    expect(
      screen.queryByText("A self-hosted publishing system, built in public."),
    ).not.toBeInTheDocument();
  });

  it("does not show English chrome text alongside Chinese", async () => {
    render(await HomePage());

    expect(screen.queryByText("View all")).not.toBeInTheDocument();
    expect(screen.queryByText("Recent Posts")).not.toBeInTheDocument();
    expect(screen.queryByText("Read Blog →")).not.toBeInTheDocument();
    expect(screen.queryByText("About →")).not.toBeInTheDocument();
  });

  it("renders unified Chinese chrome labels", async () => {
    render(await HomePage());

    expect(screen.getByRole("link", { name: "阅读文章" })).toHaveAttribute(
      "href",
      "/posts",
    );
    expect(screen.getByRole("link", { name: "关于我" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.getByRole("link", { name: "所有文章 →" })).toHaveAttribute(
      "href",
      "/posts",
    );
    expect(screen.getByRole("link", { name: "全部专栏 →" })).toHaveAttribute(
      "href",
      "/columns",
    );
    expect(
      screen.getByRole("link", { name: "完整技术选型理由 →" }),
    ).toHaveAttribute("href", "/about#tech-stack");
    expect(screen.getByRole("heading", { level: 2, name: "原则" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "技术体系" })).toBeInTheDocument();
  });
});
