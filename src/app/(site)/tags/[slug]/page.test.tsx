import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PostListItem } from "@/lib/services/posts";

const mocks = vi.hoisted(() => ({
  getCurrentLocale: vi.fn(),
  getTagBySlug: vi.fn(),
  listPosts: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/lib/i18n", () => ({
  SUPPORTED_LOCALES: ["zh", "en"],
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/tags-public", () => ({
  getTagBySlug: mocks.getTagBySlug,
}));

vi.mock("@/lib/services/posts", () => ({
  listPosts: mocks.listPosts,
}));

const tagDetailPageModulePath = "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.getTagBySlug.mockResolvedValue({
    id: "tag-id",
    slug: "foo",
    name: "Foo",
  });
  mocks.listPosts.mockResolvedValue({
    items: [post({ id: "p1", slug: "one", title: "Post One" })],
    total: 2,
    page: 1,
    pageSize: 12,
  });
  mocks.notFound.mockImplementation(() => {
    throw new Error("NOT_FOUND");
  });
});

describe("TagDetailPage", () => {
  it("rendersChineseSingleLocaleTagDetail", async () => {
    const { TagDetailPage } = await loadTagDetailPage();

    render(await TagDetailPage(pageProps("foo")));

    expect(screen.getByText("标签 · 详情")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Foo" })).toBeInTheDocument();
    expect(screen.getByText("2 篇文章")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Post One" })).toBeInTheDocument();
  });

  it("TagDetailPage calls notFound on missing tag", async () => {
    mocks.getTagBySlug.mockResolvedValue(null);
    const { TagDetailPage } = await loadTagDetailPage();

    await expect(TagDetailPage(pageProps("missing"))).rejects.toThrow("NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });

  it("TagDetailPage pagination supported via searchParams", async () => {
    mocks.listPosts.mockResolvedValue({
      items: [post({ id: "p2", slug: "two", title: "Post Two" })],
      total: 25,
      page: 2,
      pageSize: 12,
    });
    const { TagDetailPage } = await loadTagDetailPage();

    render(await TagDetailPage(pageProps("foo", { page: "2" })));

    expect(mocks.listPosts).toHaveBeenCalledWith(
      { page: 2, pageSize: 12, status: "PUBLISHED", tag: "foo" },
      "zh",
    );
    expect(screen.getByRole("link", { name: "← 上一页" })).toHaveAttribute(
      "href",
      "?page=1",
    );
    expect(screen.getByRole("link", { name: "下一页 →" })).toHaveAttribute(
      "href",
      "?page=3",
    );
  });

  it("TagDetailPage generateMetadata returns tag-aware title", async () => {
    const { generateMetadata } = await loadTagDetailPage();

    await expect(generateMetadata(pageProps("foo"))).resolves.toMatchObject({
      title: "Foo — 标签 — TZBlog",
      description: "浏览 Foo 标签下的所有文章",
    });

    mocks.getTagBySlug.mockResolvedValue(null);
    await expect(generateMetadata(pageProps("missing"))).resolves.toMatchObject({
      title: "标签不存在 — TZBlog",
    });
  });

  it("TagDetailPage empty state when 0 posts", async () => {
    mocks.listPosts.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
    });
    const { TagDetailPage } = await loadTagDetailPage();

    render(await TagDetailPage(pageProps("foo")));

    expect(screen.getByRole("heading", { level: 1, name: "Foo" })).toBeInTheDocument();
    expect(screen.getByText("这个标签下还没有发布文章。")).toBeInTheDocument();
  });
});

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function loadTagDetailPage() {
  const pageModule = (await vi.importActual(tagDetailPageModulePath)) as {
    default: (props: PageProps) => ReactElement | Promise<ReactElement>;
    generateMetadata: (props: PageProps) => Promise<{
      title?: string;
      description?: string;
    }>;
  };

  return {
    TagDetailPage: pageModule.default,
    generateMetadata: pageModule.generateMetadata,
  };
}

function pageProps(
  slug: string,
  searchParams: Record<string, string | string[] | undefined> = {},
): PageProps {
  return {
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve(searchParams),
  };
}

function post(overrides: Partial<PostListItem> = {}): PostListItem {
  return {
    id: "post-id",
    slug: "post",
    cover: null,
    status: "PUBLISHED",
    publishedAt: new Date("2026-05-21T00:00:00Z"),
    columnId: null,
    columnName: null,
    authorName: "Author",
    title: "Post Title",
    excerpt: "Post excerpt",
    tags: [{ slug: "foo", name: "Foo" }],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date("2026-05-21T00:00:00Z"),
    updatedAt: new Date("2026-05-21T00:00:00Z"),
    ...overrides,
  };
}
