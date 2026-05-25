import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChannelPreviewBlock } from "./ChannelPreviewBlock";
import type { HomeChannelPreview } from "@/lib/services/homePage";

const articlesChannel: HomeChannelPreview = {
  id: "ch-articles",
  slug: "articles",
  kind: "ARTICLES",
  name: "文章",
  tagline: "在快的时代写慢一些的字",
  entries: [
    {
      id: "e1",
      slug: "one",
      kind: "ARTICLE",
      title: "第一篇",
      excerpt: "摘要一",
      publishedAt: new Date("2026-05-24T00:00:00Z"),
    },
    {
      id: "e2",
      slug: "two",
      kind: "ARTICLE",
      title: "第二篇",
      excerpt: "摘要二",
      publishedAt: new Date("2026-05-23T00:00:00Z"),
    },
    {
      id: "e3",
      slug: "three",
      kind: "ARTICLE",
      title: "第三篇",
      excerpt: "摘要三",
      publishedAt: new Date("2026-05-22T00:00:00Z"),
    },
  ],
};

const streamChannel: HomeChannelPreview = {
  id: "ch-stream",
  slug: "stream",
  kind: "STREAM",
  name: "日志流",
  tagline: "grep my mind",
  entries: Array.from({ length: 5 }, (_, index) => ({
    id: `s${index + 1}`,
    slug: `stream-${index + 1}`,
    kind: "LINK",
    title: `流条目 ${index + 1}`,
    excerpt: `摘要 ${index + 1}`,
    publishedAt: new Date(`2026-05-${20 - index}T00:00:00Z`),
  })),
};

describe("ChannelPreviewBlock", () => {
  it("articlesChannelShowsTop3Entries", () => {
    render(<ChannelPreviewBlock channel={articlesChannel} />);

    expect(screen.getByRole("heading", { name: "文章" })).toBeInTheDocument();
    expect(screen.getByText("在快的时代写慢一些的字")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看全部 →" })).toHaveAttribute(
      "href",
      "/c/articles",
    );
    expect(screen.getAllByRole("link", { name: /第.+篇/ })).toHaveLength(3);
  });

  it("streamChannelShowsTop5Entries", () => {
    render(<ChannelPreviewBlock channel={streamChannel} />);

    expect(screen.getByRole("heading", { name: "日志流" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "进入流 →" })).toHaveAttribute(
      "href",
      "/c/stream",
    );
    expect(screen.getAllByRole("link", { name: /流条目/ })).toHaveLength(5);
  });
});
