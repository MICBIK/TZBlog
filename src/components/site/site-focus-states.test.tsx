import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LikeButton } from "./LikeButton";
import { PostCard } from "./PostCard";
import type { HeaderChannel } from "@/lib/navigation/publicNav";

import { SiteHeader } from "./SiteHeader";

const sampleChannels: HeaderChannel[] = [
  {
    slug: "articles",
    kind: "ARTICLES",
    enabled: true,
    order: 0,
    translations: [{ locale: "zh", name: "文章" }],
  },
];

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { liked: false, likeCount: 2 } }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ),
  );
});

describe("site focus states", () => {
  it("exposesVisibleFocusForInteractiveSurfaces", () => {
    render(
      <>
        <SiteHeader channels={sampleChannels} />
        <LikeButton slug="focus-post" initialLikeCount={2} />
        <PostCard
          post={{
            slug: "focus-post",
            cover: null,
            title: "Focus post",
            excerpt: "Keyboard focus should be visible.",
            publishedAt: new Date("2026-05-21T00:00:00Z"),
            tags: [{ slug: "a11y", name: "A11y" }],
            viewCount: 1,
            likeCount: 2,
            commentCount: 0,
          }}
        />
      </>,
    );

    const brand = screen.getByRole("link", { name: "TZBlog" });
    const navLink = within(
      screen.getByRole("navigation", { name: "主导航" }),
    ).getByRole("link", { name: "文章" });
    const likeButton = screen.getByRole("button", { name: "2" });
    const postCard = screen.getByRole("article", { name: "Focus post" });
    const postLink = screen.getByRole("link", { name: "Focus post" });

    for (const link of [brand, navLink]) {
      expect(link).toHaveClass(
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
        "focus-visible:ring-offset-2",
        "focus-visible:ring-offset-bg",
      );
      expect(link.className).toMatch(/hover:[^\s]+/);
      expect(link.className).toMatch(/focus-visible:[^\s]+/);
    }

    expect(likeButton).toHaveClass(
      "hover:text-fg",
      "focus-visible:text-fg",
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-ring",
      "focus-visible:ring-offset-2",
      "focus-visible:ring-offset-bg",
    );
    expect(likeButton).toHaveClass(
      "aria-pressed:border-fg",
      "aria-pressed:text-fg",
    );

    expect(postCard).toHaveAttribute("data-interactive-surface", "post-card");
    expect(postCard).toHaveClass(
      "hover:border-accent/40",
      "focus-within:border-accent/40",
      "hover:bg-muted/30",
      "focus-within:bg-muted/30",
    );
    expect(postLink).toHaveClass(
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-ring",
    );
  });
});
