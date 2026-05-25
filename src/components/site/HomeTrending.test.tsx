import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeTrending } from "./HomeTrending";
import type { HomeTrendingItem } from "@/lib/services/homePage";

const items: HomeTrendingItem[] = [
  {
    id: "1",
    slug: "hot-post",
    kind: "ARTICLE",
    title: "最热文章",
    channelSlug: "articles",
    channelName: "文章",
    trendingScore: 12.5,
    publishedAt: new Date("2026-05-20T00:00:00Z"),
  },
  {
    id: "2",
    slug: "warm-post",
    kind: "ARTICLE",
    title: "次热文章",
    channelSlug: "articles",
    channelName: "文章",
    trendingScore: 8.1,
    publishedAt: new Date("2026-05-21T00:00:00Z"),
  },
];

describe("HomeTrending", () => {
  it("trendingReadsByScoreDesc", () => {
    render(<HomeTrending items={items} />);

    expect(screen.getByTestId("home-trending")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "近期热门" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "最热文章" })).toHaveAttribute(
      "href",
      "/posts/hot-post",
    );
    expect(screen.getByText("次热文章")).toBeInTheDocument();
  });
});
