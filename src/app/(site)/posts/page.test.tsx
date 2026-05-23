import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PostsListPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getCurrentLocale: vi.fn(),
  listPosts: vi.fn(),
}));

vi.mock("@/lib/i18n", () => ({
  DEFAULT_LOCALE: "zh",
  SUPPORTED_LOCALES: ["zh", "en"],
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/posts", () => ({
  listPosts: mocks.listPosts,
}));

vi.mock("@/components/site/PostCard", () => ({
  PostCard: ({ post }: { post: { title: string } }) => (
    <article data-testid="post-card">{post.title}</article>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.listPosts.mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
  });
});

describe("PostsListPage i18n chrome", () => {
  it("uses Chinese title and metadata for the single-locale site", async () => {
    expect(metadata.title).toBe("文章 — TZBlog");
    expect(metadata.description).toBe("所有已发布文章");

    render(await PostsListPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1, name: "文章" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Blog" })).not.toBeInTheDocument();
  });
});
