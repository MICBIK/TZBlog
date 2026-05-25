import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentLocale: vi.fn(),
  getChannelPageBySlug: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/lib/i18n", () => ({
  DEFAULT_LOCALE: "zh",
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/channels", () => ({
  getChannelPageBySlug: mocks.getChannelPageBySlug,
}));

const pageModulePath = "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.notFound.mockImplementation(() => {
    throw new Error("NOT_FOUND");
  });
});

describe("ChannelDetailPage", () => {
  it("incompatibleKindLayoutStillRenders", async () => {
    mocks.getChannelPageBySlug.mockResolvedValue(channelFixture({
      kind: "NOTES",
      layout: "CHRONICLE",
    }));

    const { default: ChannelDetailPage } = await import(pageModulePath);
    render(await ChannelDetailPage(pageProps("notes")));

    expect(screen.getByTestId("chronicle-layout")).toBeInTheDocument();
  });

  it("metadataAndOgTagsCorrect", async () => {
    mocks.getChannelPageBySlug.mockResolvedValue(channelFixture());

    const { generateMetadata } = await import(pageModulePath);
    await expect(generateMetadata(pageProps("articles"))).resolves.toMatchObject({
      title: "文章 — TZBlog",
      description: "长文频道",
      openGraph: {
        title: "文章",
        description: "长文频道",
        type: "website",
      },
    });
  });
});

function pageProps(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

function channelFixture(
  overrides: Partial<{
    kind: "ARTICLES" | "NOTES";
    layout: "CHRONICLE" | "CARDS" | "TIMELINE" | "GREP" | "FEED";
  }> = {},
) {
  return {
    id: "ch-1",
    slug: "articles",
    kind: overrides.kind ?? "ARTICLES",
    layout: overrides.layout ?? "CHRONICLE",
    enabled: true,
    order: 0,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    translations: [
      {
        id: "tr-1",
        channelId: "ch-1",
        locale: "zh",
        name: "文章",
        description: "长文频道",
        tagline: null,
      },
    ],
    entries: [
      {
        id: "e1",
        slug: "hello",
        channelId: "ch-1",
        authorId: "u1",
        kind: "ARTICLE",
        status: "PUBLISHED",
        publishedAt: new Date("2026-05-01T08:00:00Z"),
        body: "body",
        metadata: { cover: "/uploads/cover.png", readingMinutes: 5 },
        seriesId: null,
        seriesOrder: null,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        trendingScore: 0,
        createdAt: new Date("2026-05-01T08:00:00Z"),
        updatedAt: new Date("2026-05-01T08:00:00Z"),
        translations: [
          {
            id: "etr-1",
            entryId: "e1",
            locale: "zh",
            title: "你好世界",
            excerpt: "摘要",
          },
        ],
        tags: [],
      },
    ],
  };
}
