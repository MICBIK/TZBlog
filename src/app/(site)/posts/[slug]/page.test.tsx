import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PostWithRelations } from "@/lib/services/posts";
import PostDetailPage, { generateMetadata } from "./page";

const mocks = vi.hoisted(() => ({
  extractToc: vi.fn(),
  getCurrentLocale: vi.fn(),
  getPostBySlug: vi.fn(),
  notFound: vi.fn(),
  renderMarkdown: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/lib/i18n", () => ({
  DEFAULT_LOCALE: "zh",
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/posts", () => ({
  getPostBySlug: mocks.getPostBySlug,
}));

vi.mock("@/lib/markdown", () => ({
  extractToc: mocks.extractToc,
  renderMarkdown: mocks.renderMarkdown,
}));

vi.mock("@/components/site/PostViewBeacon", () => ({
  PostViewBeacon: ({ slug }: { slug: string }) => (
    <div data-testid="post-view-beacon">{slug}</div>
  ),
}));

vi.mock("@/components/site/LikeButton", () => ({
  LikeButton: ({
    slug,
    initialLikeCount,
  }: {
    slug: string;
    initialLikeCount: number;
  }) => (
    <div
      data-testid="mock-like-button"
      data-slug={slug}
      data-initial-count={String(initialLikeCount)}
    />
  ),
}));

vi.mock("@/components/site/CommentSection", () => ({
  CommentSection: ({ postId, slug }: { postId: string; slug: string }) => (
    <div
      data-testid="mock-comment-section"
      data-post-id={postId}
      data-slug={slug}
    />
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.extractToc.mockResolvedValue([]);
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.renderMarkdown.mockResolvedValue("<p>正文</p>");
  mocks.notFound.mockImplementation(() => {
    throw new Error("not found");
  });
});

describe("PostDetailPage cover banner", () => {
  it("renders cover hero banner above title when set", async () => {
    mocks.getPostBySlug.mockResolvedValue(
      post({ cover: "/uploads/2026/05/detail-cover.png" }),
    );

    render(await PostDetailPage({ params: Promise.resolve({ slug: "detail" }) }));

    const img = screen.getByRole("img", { name: "Detail Title" });
    const title = screen.getByRole("heading", { name: "Detail Title" });
    expect(img).toHaveAttribute("src", "/uploads/2026/05/detail-cover.png");
    expect(img.compareDocumentPosition(title)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("skips cover banner when cover is null", async () => {
    mocks.getPostBySlug.mockResolvedValue(post({ cover: null }));

    render(await PostDetailPage({ params: Promise.resolve({ slug: "detail" }) }));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Detail Title" }),
    ).toBeInTheDocument();
  });
});

describe("PostDetailPage TOC", () => {
  it("does not render toc aside when headings empty", async () => {
    mocks.extractToc.mockResolvedValue([]);
    mocks.getPostBySlug.mockResolvedValue(post({ cover: null }));

    render(await PostDetailPage({ params: Promise.resolve({ slug: "detail" }) }));

    expect(screen.queryByTestId("post-toc")).toBeNull();
  });

  it("renders toc aside when headings present", async () => {
    mocks.extractToc.mockResolvedValue([{ id: "a", text: "A", level: 2 }]);
    mocks.getPostBySlug.mockResolvedValue(post({ cover: null }));

    render(await PostDetailPage({ params: Promise.resolve({ slug: "detail" }) }));

    expect(screen.getByTestId("post-toc")).toBeInTheDocument();
  });
});

describe("PostDetailPage D3 integration (SPEC-D3-C-12)", () => {
  it("renders LikeButton in place of likes count + CommentSection at end of article", async () => {
    mocks.getPostBySlug.mockResolvedValue(post({ cover: null }));

    render(
      await PostDetailPage({ params: Promise.resolve({ slug: "detail" }) }),
    );

    // LikeButton 出现，props 来自 post
    const likeBtn = screen.getByTestId("mock-like-button");
    expect(likeBtn).toHaveAttribute("data-slug", "detail");
    expect(likeBtn).toHaveAttribute("data-initial-count", "2");

    // 原 "likes N" 静态数字已被替换（不应再出现 likes 2 文本）
    expect(screen.queryByText(/^likes 2$/)).toBeNull();

    // CommentSection 出现，props 含 postId + slug
    const section = screen.getByTestId("mock-comment-section");
    expect(section).toHaveAttribute("data-post-id", "post-id");
    expect(section).toHaveAttribute("data-slug", "detail");
  });

  it("renders stats chrome in Chinese for the single-locale site", async () => {
    mocks.getPostBySlug.mockResolvedValue(post({ cover: null }));

    render(
      await PostDetailPage({ params: Promise.resolve({ slug: "detail" }) }),
    );

    expect(screen.getByText("10 次浏览")).toBeInTheDocument();
    expect(screen.getByText("1 条评论")).toBeInTheDocument();
    expect(screen.queryByText(/^views 10$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^comments 1$/)).not.toBeInTheDocument();
  });
});

describe("PostDetailPage metadata i18n current state", () => {
  it("does not emit fake alternates.languages for missing locale routes", async () => {
    mocks.getPostBySlug.mockResolvedValue(post({ cover: null }));

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "detail" }),
    });

    expect(metadata.alternates).toBeUndefined();
  });
});

describe("PostDetailPage markdown reading system", () => {
  it("renders article HTML inside markdown-body instead of prose-only defaults", async () => {
    mocks.getPostBySlug.mockResolvedValue(post({ cover: null }));

    const { container } = render(
      await PostDetailPage({ params: Promise.resolve({ slug: "detail" }) }),
    );

    const articleBody = container.querySelector(".markdown-body");
    expect(articleBody).toBeInTheDocument();
    expect(articleBody?.className).toContain("max-w-none");
    expect(articleBody?.className).not.toContain("prose");
  });

  it("renders complex markdown with callouts, code, table, lists, blockquote, kbd", async () => {
    vi.doUnmock("@/lib/markdown");
    vi.resetModules();
    const { default: PostDetailPageWithRealMarkdown } = await import("./page");
    const fixture = readFileSync(
      join(process.cwd(), "src/lib/markdown/__fixtures__/full-syntax.md"),
      "utf-8",
    );
    mocks.getPostBySlug.mockResolvedValue(post({ cover: null, content: fixture }));

    const { container } = render(
      await PostDetailPageWithRealMarkdown({
        params: Promise.resolve({ slug: "detail" }),
      }),
    );

    const articleBody = container.querySelector(".markdown-body");
    expect(articleBody).toBeInTheDocument();
    expect(articleBody?.querySelector(".markdown-alert-warning")).toBeInTheDocument();
    expect(articleBody?.querySelector(".markdown-alert-icon")).toBeInTheDocument();
    expect(articleBody?.querySelector('figure.code-block[data-language="ts"]')).toBeInTheDocument();
    expect(articleBody?.querySelector(".code-block-filename")?.textContent).toBe(
      "src/example.ts",
    );
    expect(articleBody?.querySelector(".code-block-copy[data-copy]")).toBeInTheDocument();
    expect(articleBody?.querySelector(".md-table-scroll table")).toBeInTheDocument();
    expect(articleBody?.querySelector("ul ul ul")).toBeInTheDocument();
    expect(articleBody?.querySelector("blockquote p + p")).toBeInTheDocument();
    expect(articleBody?.querySelector("kbd")?.textContent).toBe("⌘K");
    expect(articleBody?.querySelector(".prose")).not.toBeInTheDocument();
  });
});

describe("PostDetailPage tag links", () => {
  it("Post detail page tag links use /tags/{slug}", async () => {
    mocks.getPostBySlug.mockResolvedValue(
      post({
        cover: null,
        tags: [
          {
            tag: { id: "tag-id", slug: "foo", name: "Foo" },
          },
        ],
      }),
    );

    render(
      await PostDetailPage({ params: Promise.resolve({ slug: "detail" }) }),
    );

    expect(screen.getByRole("link", { name: "#foo" })).toHaveAttribute(
      "href",
      "/tags/foo",
    );
  });
});

function post({
  cover,
  content = "Detail content",
  tags = [],
}: {
  cover: string | null;
  content?: string;
  tags?: PostWithRelations["tags"];
}): PostWithRelations {
  return {
    id: "post-id",
    slug: "detail",
    cover,
    status: "PUBLISHED",
    publishedAt: new Date("2026-05-21T00:00:00Z"),
    authorId: "author-id",
    columnId: null,
    viewCount: 10,
    likeCount: 2,
    commentCount: 1,
    createdAt: new Date("2026-05-21T00:00:00Z"),
    updatedAt: new Date("2026-05-21T00:00:00Z"),
    translations: [
      {
        id: "tr-id",
        postId: "post-id",
        locale: "zh",
        title: "Detail Title",
        excerpt: "Detail excerpt",
        content,
      },
    ],
    column: null,
    tags,
    author: { id: "author-id", email: "author@example.com", name: "Author" },
  } as PostWithRelations;
}
