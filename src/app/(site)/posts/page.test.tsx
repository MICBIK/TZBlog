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

describe("PostsListPage article discovery", () => {
  it("rendersDenseArticleMetadata", async () => {
    mocks.listPosts.mockResolvedValue({
      items: [
        {
          id: "post-1",
          slug: "dense-metadata",
          cover: null,
          status: "PUBLISHED",
          publishedAt: new Date("2026-05-23T00:00:00Z"),
          columnId: "column-1",
          columnName: "工程札记",
          authorName: "HaiDen",
          title: "高密度文章索引",
          excerpt: "标题、摘要、标签、统计和阅读时间必须能被快速扫描。",
          tags: [
            { slug: "nextjs", name: "Next.js" },
            { slug: "design", name: "Design" },
          ],
          viewCount: 128,
          likeCount: 9,
          commentCount: 3,
          createdAt: new Date("2026-05-22T00:00:00Z"),
          updatedAt: new Date("2026-05-23T00:00:00Z"),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
    });

    render(await PostsListPage({ searchParams: Promise.resolve({}) }));

    const article = screen.getByRole("article", {
      name: "高密度文章索引",
    });

    expect(article).toHaveAttribute("data-post-card", "dense");
    expect(screen.getByRole("link", { name: "高密度文章索引" })).toHaveAttribute(
      "href",
      "/posts/dense-metadata",
    );
    expect(
      screen.getByText("标题、摘要、标签、统计和阅读时间必须能被快速扫描。"),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-05-23")).toBeInTheDocument();
    expect(screen.getByText("工程札记")).toBeInTheDocument();
    expect(screen.getByText("1 分钟阅读")).toBeInTheDocument();
    expect(screen.getByText("128 次浏览")).toBeInTheDocument();
    expect(screen.getByText("9 个赞")).toBeInTheDocument();
    expect(screen.getByText("3 条评论")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "#Next.js" })).toHaveAttribute(
      "href",
      "/tags/nextjs",
    );
    expect(screen.getByRole("link", { name: "#Design" })).toHaveAttribute(
      "href",
      "/tags/design",
    );
  });

  it("syncsDiscoveryFiltersWithUrl", async () => {
    mocks.listPosts.mockResolvedValue({
      items: [],
      total: 25,
      page: 2,
      pageSize: 12,
    });

    render(
      await PostsListPage({
        searchParams: Promise.resolve({
          q: "notion",
          tag: "nextjs",
          columnId: "column-1",
          page: "2",
        }),
      }),
    );

    expect(mocks.listPosts).toHaveBeenCalledWith(
      {
        page: 2,
        pageSize: 12,
        status: "PUBLISHED",
        tag: "nextjs",
        columnId: "column-1",
        q: "notion",
      },
      "zh",
    );
    expect(screen.getByRole("search", { name: "文章筛选" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "搜索文章" })).toHaveValue("notion");
    expect(screen.getByText("关键词：notion")).toBeInTheDocument();
    expect(screen.getByText("标签：nextjs")).toBeInTheDocument();
    expect(screen.getByText("专栏：column-1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "清除筛选" })).toHaveAttribute(
      "href",
      "/posts",
    );
    expect(screen.getByRole("link", { name: "← 上一页" })).toHaveAttribute(
      "href",
      "/posts?q=notion&tag=nextjs&columnId=column-1&page=1",
    );
    expect(screen.getByRole("link", { name: "下一页 →" })).toHaveAttribute(
      "href",
      "/posts?q=notion&tag=nextjs&columnId=column-1&page=3",
    );
  });
});
