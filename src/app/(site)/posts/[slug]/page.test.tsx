import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PostWithRelations } from "@/lib/services/posts";
import PostDetailPage from "./page";

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

function post({ cover }: { cover: string | null }): PostWithRelations {
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
        content: "Detail content",
      },
    ],
    column: null,
    tags: [],
    author: { id: "author-id", email: "author@example.com", name: "Author" },
  } as PostWithRelations;
}
