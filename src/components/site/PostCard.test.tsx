import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostCard } from "./PostCard";

type PostCardPost = Parameters<typeof PostCard>[0]["post"];

describe("PostCard cover", () => {
  it("renders cover img with alt and lazy when cover set", () => {
    render(<PostCard post={post({ cover: "/uploads/2026/05/cover.png" })} />);

    const img = screen.getByRole("img", { name: "Cover Title" });
    expect(img).toHaveAttribute("src", "/uploads/2026/05/cover.png");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveClass("h-full", "w-full", "object-cover");
  });

  it("does not render cover area when cover is null", () => {
    render(<PostCard post={post({ cover: null })} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("PostCard tag links", () => {
  it("PostCard tag link points to /tags/{slug}", () => {
    render(
      <PostCard
        post={post({
          cover: null,
          tags: [{ slug: "foo", name: "Foo" }],
        })}
      />,
    );

    expect(screen.getByRole("link", { name: /Foo/ })).toHaveAttribute(
      "href",
      "/tags/foo",
    );
  });
});

describe("PostCard layout stability", () => {
  it("keepsCardLayoutStableAcrossCoverStates", () => {
    const longTitle =
      "这是一篇标题非常非常长的文章，用来验证文章卡片在移动端和桌面端都不会把发布时间、阅读时间、浏览、点赞、评论这些元信息挤出可读区域";
    const { rerender, container } = render(
      <PostCard post={post({ cover: "/uploads/cover.png", title: longTitle })} />,
    );

    const articleWithCover = screen.getByRole("article", { name: longTitle });
    expect(articleWithCover).toHaveAttribute("data-cover-state", "with-cover");
    expect(articleWithCover).toHaveClass("min-w-0", "max-w-full");
    expect(container.querySelector("[data-post-cover]")).toHaveClass(
      "aspect-[16/10]",
      "w-32",
      "shrink-0",
      "md:w-44",
    );
    expect(screen.getByRole("link", { name: longTitle })).toHaveClass(
      "break-words",
      "hyphens-auto",
    );
    expect(screen.getByText("2026-05-21")).toBeInTheDocument();
    expect(screen.getByText("1 分钟阅读")).toBeInTheDocument();
    expect(screen.getByText("0 次浏览")).toBeInTheDocument();

    rerender(<PostCard post={post({ cover: null, title: longTitle })} />);

    const articleWithoutCover = screen.getByRole("article", { name: longTitle });
    expect(articleWithoutCover).toHaveAttribute("data-cover-state", "no-cover");
    expect(container.querySelector("[data-post-cover]")).not.toBeInTheDocument();
    expect(screen.getByText("2026-05-21")).toBeInTheDocument();
    expect(screen.getByText("0 条评论")).toBeInTheDocument();
  });
});

describe("PostCard interaction states", () => {
  it("exposesKeyboardFocusEquivalentToHover", () => {
    render(<PostCard post={post({ cover: null })} />);

    const article = screen.getByRole("article", { name: "Cover Title" });
    const titleLink = screen.getByRole("link", { name: "Cover Title" });

    expect(article).toHaveAttribute("data-interactive-surface", "post-card");
    expect(article).toHaveClass(
      "hover:border-accent/40",
      "focus-within:border-accent/40",
      "hover:bg-muted/30",
      "focus-within:bg-muted/30",
    );
    expect(titleLink).toHaveClass(
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-ring",
    );
  });
});

function post(
  overrides: {
    cover: string | null;
    tags?: Array<{ slug: string; name: string }>;
    title?: string;
  },
): PostCardPost {
  return {
    slug: "cover-post",
    title: "Cover Title",
    excerpt: "Cover excerpt",
    publishedAt: new Date("2026-05-21T00:00:00Z"),
    columnName: null,
    tags: [],
    ...overrides,
  } as unknown as PostCardPost;
}
