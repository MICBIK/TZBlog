import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PostListItem } from "@/lib/services/posts";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getCurrentLocale: vi.fn(),
  listPosts: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/i18n", () => ({
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/posts", () => ({
  listPosts: mocks.listPosts,
}));

const modulePath = "./HomeFeaturedAndRecent";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue(null);
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.listPosts.mockResolvedValue({
    items: makePosts(8),
    total: 8,
    page: 1,
    pageSize: 8,
  });
});

describe("<HomeFeaturedAndRecent />", () => {
  it("renders one featured large card and 5-8 recent rows", async () => {
    const { container } = render(await homeFeaturedAndRecent());

    expect(screen.getByRole("heading", { level: 2, name: "最新文章" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "所有文章 →" })).toHaveAttribute(
      "href",
      "/posts",
    );

    const featured = screen.getByTestId("home-featured-post");
    expect(within(featured).getByRole("link", { name: "文章 1" })).toHaveAttribute(
      "href",
      "/posts/post-1",
    );
    expect(within(featured).getByText("第一篇精选摘要")).toBeInTheDocument();
    expect(within(featured).getByText("#source")).toBeInTheDocument();
    expect(within(featured).getByText("#markdown")).toBeInTheDocument();
    expect(screen.getByTestId("home-featured-cover")).toHaveClass("aspect-[3/1]");

    const recent = screen.getByTestId("home-recent-posts");
    expect(within(recent).getAllByRole("article")).toHaveLength(7);
    expect(within(recent).getByRole("link", { name: "文章 2" })).toBeInTheDocument();
    expect(within(recent).getByRole("link", { name: "文章 8" })).toBeInTheDocument();
    expect(within(recent).queryByRole("img")).not.toBeInTheDocument();
    expect(
      container.querySelector(".space-y-\\[var\\(--space-stack-lg\\)\\]"),
    ).toBeInTheDocument();
  });

  it("renders empty state when no published posts", async () => {
    mocks.listPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 8,
    });

    const { rerender } = render(await homeFeaturedAndRecent());

    expect(screen.getByText("还没有发布的文章。")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "新建文章" })).not.toBeInTheDocument();

    mocks.auth.mockResolvedValue({
      user: { id: "admin-id", email: "admin@example.com", role: "ADMIN" },
    });

    rerender(await homeFeaturedAndRecent());

    expect(screen.getByRole("link", { name: "新建文章" })).toHaveAttribute(
      "href",
      "/admin/posts/new",
    );
  });

  it("queries only PUBLISHED posts", async () => {
    await homeFeaturedAndRecent();

    expect(mocks.getCurrentLocale).toHaveBeenCalledTimes(1);
    expect(mocks.listPosts).toHaveBeenCalledWith(
      { status: "PUBLISHED", page: 1, pageSize: 8 },
      "zh",
    );
  });
});

async function homeFeaturedAndRecent() {
  const { HomeFeaturedAndRecent } = (await vi.importActual(modulePath)) as {
    HomeFeaturedAndRecent: () => Promise<ReactNode>;
  };
  return HomeFeaturedAndRecent();
}

function makePosts(count: number): PostListItem[] {
  return Array.from({ length: count }, (_, index) =>
    post({
      id: `p${index + 1}`,
      slug: `post-${index + 1}`,
      cover: `https://example.com/cover-${index + 1}.jpg`,
      title: `文章 ${index + 1}`,
      excerpt: index === 0 ? "第一篇精选摘要" : `摘要 ${index + 1}`,
      publishedAt: new Date(`2026-05-${23 - index}T00:00:00Z`),
      tags:
        index === 0
          ? [
              { slug: "source", name: "source" },
              { slug: "markdown", name: "markdown" },
            ]
          : [{ slug: `tag-${index + 1}`, name: `tag-${index + 1}` }],
    }),
  );
}

function post(overrides: Partial<PostListItem>): PostListItem {
  return {
    id: "post-id",
    slug: "post",
    cover: null,
    status: "PUBLISHED",
    publishedAt: new Date("2026-05-23T00:00:00Z"),
    columnId: null,
    columnName: null,
    authorName: "作者",
    title: "文章",
    excerpt: "摘要",
    tags: [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date("2026-05-01T00:00:00Z"),
    updatedAt: new Date("2026-05-01T00:00:00Z"),
    ...overrides,
  };
}
