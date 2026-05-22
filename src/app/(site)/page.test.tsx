import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PostListItem } from "@/lib/services/posts";
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

vi.mock("@/components/site/GithubCard", () => ({
  GithubCard: () => (
    <section data-testid="github-card-stub">
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

describe("HomePage recent posts", () => {
  it("renders HeroEditorial and keeps downstream homepage sections", async () => {
    render(await HomePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Building things,\s*one commit\s*at a time\./,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Hi, I'm HaiDen." }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read Blog →" })).toHaveAttribute(
      "href",
      "/posts",
    );
    expect(screen.getByRole("link", { name: "About →" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Recent Posts" })).toBeInTheDocument();
    expect(screen.getByText("0 views · 0 posts · 0 comments")).toBeInTheDocument();
  });

  it("renders TechStack between hero and recent posts", async () => {
    render(await HomePage());

    expect(screen.getByText("FRONTEND")).toBeInTheDocument();
    expect(screen.getByText("CONTENT & EDITOR")).toBeInTheDocument();
    expect(screen.getByText("Next.js 16")).toBeInTheDocument();
    expect(screen.getByText("App Router + RSC + Server Actions")).toBeInTheDocument();
    expect(screen.queryByText(/\$\s*whoami/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Recent Posts" })).toBeInTheDocument();
    expect(screen.getByText("0 views · 0 posts · 0 comments")).toBeInTheDocument();
  });

  it("homepage renders GithubCard between TechStack and Recent Posts", async () => {
    render(await HomePage());

    const techStackLabel = screen.getByText("FRONTEND");
    const githubCard = screen.getByTestId("github-card-stub");
    const githubLabel = screen.getByText("GITHUB · DEVELOPMENT");
    const recentHeading = screen.getByRole("heading", {
      level: 2,
      name: "Recent Posts",
    });

    expect(githubCard).toBeInTheDocument();
    expect(githubLabel).toBeInTheDocument();
    expect(
      techStackLabel.compareDocumentPosition(githubCard) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      githubCard.compareDocumentPosition(recentHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders top 3 published posts in publishedAt desc", async () => {
    mocks.listPosts.mockResolvedValue({
      items: [
        post({
          id: "p1",
          slug: "newest",
          title: "最新文章",
          excerpt: "最新摘要",
          publishedAt: new Date("2026-05-21T00:00:00Z"),
        }),
        post({
          id: "p2",
          slug: "middle",
          title: "中间文章",
          excerpt: "中间摘要",
          publishedAt: new Date("2026-05-20T00:00:00Z"),
        }),
        post({
          id: "p3",
          slug: "oldest",
          title: "较早文章",
          excerpt: "较早摘要",
          publishedAt: new Date("2026-05-19T00:00:00Z"),
        }),
      ],
      total: 5,
      page: 1,
      pageSize: 3,
    });

    render(await HomePage());

    expect(mocks.listPosts).toHaveBeenCalledWith(
      { page: 1, pageSize: 3, status: "PUBLISHED" },
      "zh",
    );
    const recent = screen.getByTestId("home-recent-posts");
    expect(
      within(recent).getAllByRole("link").map((link) => link.textContent),
    ).toEqual([
      expect.stringContaining("最新文章"),
      expect.stringContaining("中间文章"),
      expect.stringContaining("较早文章"),
    ]);
    expect(within(recent).getByText("最新摘要")).toBeInTheDocument();
    expect(within(recent).getByText("中间摘要")).toBeInTheDocument();
    expect(within(recent).getByText("较早摘要")).toBeInTheDocument();
    expect(within(recent).getByText("2026-05-21")).toBeInTheDocument();
    expect(within(recent).getByText("2026-05-20")).toBeInTheDocument();
    expect(within(recent).getByText("2026-05-19")).toBeInTheDocument();
  });

  it("renders empty placeholder when no published posts", async () => {
    render(await HomePage());

    expect(screen.getByText("还没有发布的文章。")).toBeInTheDocument();
  });
});

describe("HomePage site stats", () => {
  it("renders site stats from getSiteStats", async () => {
    mocks.getSiteStats.mockResolvedValue({
      views: 60,
      posts: 3,
      comments: 2,
    });

    render(await HomePage());

    expect(mocks.getSiteStats).toHaveBeenCalledTimes(1);
    expect(screen.getByText("60 views · 3 posts · 2 comments")).toBeInTheDocument();
  });
});

function post(overrides: Partial<PostListItem>): PostListItem {
  return {
    id: "post-id",
    slug: "post",
    cover: null,
    status: "PUBLISHED",
    publishedAt: new Date("2026-05-21T00:00:00Z"),
    columnId: null,
    columnName: null,
    authorName: "作者",
    title: "文章",
    excerpt: "摘要",
    tags: [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date("2026-05-21T00:00:00Z"),
    updatedAt: new Date("2026-05-21T00:00:00Z"),
    ...overrides,
  };
}
