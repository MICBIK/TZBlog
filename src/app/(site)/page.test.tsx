import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomePageContent } from "@/components/site/HomePageContent";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const sampleData = {
  hero: {
    tagline: "个人写作，工程实现，克制表达。",
    subtitle: "博客副标题",
    avatar: "https://cdn.example.com/avatar.png",
  },
  channels: [
    {
      id: "ch-articles",
      slug: "articles",
      kind: "ARTICLES" as const,
      name: "文章",
      tagline: "在快的时代写慢一些的字",
      entries: [
        {
          id: "e1",
          slug: "one",
          kind: "ARTICLE",
          title: "第一篇",
          excerpt: "摘要",
          publishedAt: new Date("2026-05-24T00:00:00Z"),
        },
      ],
    },
    {
      id: "ch-stream",
      slug: "stream",
      kind: "STREAM" as const,
      name: "日志流",
      tagline: "grep my mind",
      entries: [],
    },
  ],
  trending: [
    {
      id: "t1",
      slug: "hot-post",
      kind: "ARTICLE",
      title: "最热文章",
      channelSlug: "articles",
      channelName: "文章",
      trendingScore: 9.9,
      publishedAt: new Date("2026-05-24T00:00:00Z"),
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderHome(data: typeof sampleData) {
  render(
    <ThemeProvider theme="aurora" hero>
      <HomePageContent data={data} />
    </ThemeProvider>,
  );
}

describe("HomePage composition", () => {
  it("rendersHeroAndChannelPreviewsAndTrending", () => {
    renderHome(sampleData);

    expect(screen.getByTestId("home-hero")).toBeInTheDocument();
    expect(screen.getByTestId("channel-preview-articles")).toBeInTheDocument();
    expect(screen.getByTestId("channel-preview-stream")).toBeInTheDocument();
    expect(screen.getByTestId("home-trending")).toBeInTheDocument();
    expect(
      screen.getByTestId("home-hero").closest("[data-theme='aurora'][data-hero='true']"),
    ).toBeTruthy();
  });
});
