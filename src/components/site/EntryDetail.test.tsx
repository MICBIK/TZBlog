import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import type { PublicEntry } from "@/lib/services/entryPublic";

const mocks = vi.hoisted(() => ({
  extractToc: vi.fn(),
  getCurrentLocale: vi.fn(),
  renderMarkdown: vi.fn(),
}));

vi.mock("@/lib/i18n", () => ({
  DEFAULT_LOCALE: "zh",
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/markdown", () => ({
  extractToc: mocks.extractToc,
  renderMarkdown: mocks.renderMarkdown,
}));

vi.mock("@/components/site/EntryViewBeacon", () => ({
  EntryViewBeacon: () => <div data-testid="entry-view-beacon" />,
}));

vi.mock("@/components/site/LikeButton", () => ({
  LikeButton: () => <button type="button">Like</button>,
}));

vi.mock("@/components/site/CommentSection", () => ({
  CommentSection: () => <section data-testid="comment-section" />,
}));

vi.mock("@/components/reading/ReadingProgress", () => ({
  ReadingProgress: () => null,
}));

vi.mock("@/components/markdown/MarkdownCopyButtons", () => ({
  MarkdownCopyButtons: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.extractToc.mockResolvedValue([
    { id: "intro", text: "Intro", level: 2 },
  ]);
  mocks.renderMarkdown.mockResolvedValue("<p>正文</p>");
});

describe("EntryDetail kind renderers", () => {
  it("articleRendersTocReadingMinutesShikiAndGhAlerts", async () => {
    vi.doUnmock("@/lib/markdown");
    vi.resetModules();
    const { EntryDetail } = await import("./EntryDetail");
    const fixture = readFileSync(
      join(process.cwd(), "src/lib/markdown/__fixtures__/full-syntax.md"),
      "utf-8",
    );

    const { container } = render(
      await EntryDetail({
        entry: entryFixture({
          kind: "ARTICLE",
          body: fixture,
          metadata: { readingMinutes: 8, toc: true },
        }),
      }),
      { wrapper: ({ children }) => (
        <ThemeProvider theme="ink">{children}</ThemeProvider>
      ) },
    );

    expect(screen.getByRole("article")).toHaveAttribute("data-article-reader");
    expect(container.querySelector(".markdown-alert-warning")).toBeInTheDocument();
    expect(
      container.querySelector('figure.code-block[data-language="ts"]'),
    ).toBeInTheDocument();
    expect(screen.getByText("8 分钟阅读")).toBeInTheDocument();
  });

  it("noteRendersProseWithoutToc", async () => {
    const { EntryDetail } = await import("./EntryDetail");

    const { container } = render(
      await EntryDetail({
        entry: entryFixture({ kind: "NOTE", body: "Short note" }),
      }),
    );

    expect(container.querySelector("[data-entry-note-body]")).toHaveClass("markdown-body");
    expect(screen.queryByTestId("post-toc")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reading-toc")).not.toBeInTheDocument();
  });

  it("linkRendersSourceCardAboveBody", async () => {
    const { EntryDetail } = await import("./EntryDetail");

    render(
      await EntryDetail({
        entry: entryFixture({
          kind: "LINK",
          metadata: {
            sourceUrl: "https://example.com/post",
            sourceTitle: "Postgres locks",
            sourceAuthor: "Author",
            domain: "example.com",
          },
        }),
      }),
    );

    const card = screen.getByTestId("entry-link-card");
    const body = document.querySelector("[data-entry-link-body] .markdown-body");
    expect(card).toHaveTextContent("Postgres locks");
    expect(card.compareDocumentPosition(body!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("quoteRendersLargeQuoteAuthorAndSourceLink", async () => {
    const { EntryDetail } = await import("./EntryDetail");

    render(
      await EntryDetail({
        entry: entryFixture({
          kind: "QUOTE",
          metadata: {
            author: "Linus",
            source: "Interview",
            sourceUrl: "https://example.com/source",
          },
        }),
      }),
    );

    expect(screen.getByTestId("entry-quote")).toBeInTheDocument();
    expect(document.querySelector("[data-entry-quote-author]")!).toHaveTextContent("Linus");
    expect(screen.getByRole("link", { name: "Interview" })).toHaveAttribute(
      "href",
      "https://example.com/source",
    );
  });

  it("reviewRendersStarsCoverExternalLinkAndBody", async () => {
    const { EntryDetail } = await import("./EntryDetail");

    render(
      await EntryDetail({
        entry: entryFixture({
          kind: "REVIEW",
          metadata: {
            itemType: "book",
            itemTitle: "Deep Work",
            itemAuthor: "Cal Newport",
            rating: 4,
            externalUrl: "https://example.com/book",
            cover: "/uploads/cover.png",
          },
        }),
      }),
    );

    expect(document.querySelector("[data-entry-review-rating]")!).toHaveTextContent("★★★★☆");
    expect(document.querySelector("[data-entry-review-cover]")!).toBeInTheDocument();
    expect(document.querySelector("[data-entry-review-link]")!).toHaveAttribute(
      "href",
      "https://example.com/book",
    );
    expect(document.querySelector("[data-entry-review] .markdown-body")).toBeTruthy();
  });

  it("hotTakeRendersPlatformSnippetAndBody", async () => {
    const { EntryDetail } = await import("./EntryDetail");

    render(
      await EntryDetail({
        entry: entryFixture({
          kind: "HOT_TAKE",
          metadata: {
            sourcePlatform: "hackernews",
            sourceUrl: "https://news.ycombinator.com/item?id=1",
            sourceSnippet: "Hot take snippet",
          },
        }),
      }),
    );

    expect(document.querySelector("[data-entry-hot-take-platform]")!).toHaveTextContent(
      "Hacker News",
    );
    expect(document.querySelector("[data-entry-hot-take-snippet]")!).toHaveTextContent(
      "Hot take snippet",
    );
    expect(document.querySelector("[data-entry-hot-take] .markdown-body")).toBeTruthy();
  });

  it("jokeRendersSimpleProse", async () => {
    const { EntryDetail } = await import("./EntryDetail");

    render(
      await EntryDetail({
        entry: entryFixture({ kind: "JOKE", body: "Why did the function return?" }),
      }),
    );

    expect(document.querySelector("[data-entry-joke-body]")).toHaveClass("markdown-body");
  });
});

function entryFixture(
  overrides: Partial<{
    kind: PublicEntry["kind"];
    body: string;
    metadata: Record<string, unknown>;
  }> = {},
): PublicEntry {
  const body = overrides.body ?? "Body content";
  return {
    id: "entry-1",
    slug: "entry-slug",
    kind: overrides.kind ?? "NOTE",
    status: "PUBLISHED",
    publishedAt: new Date("2026-05-21T00:00:00Z"),
    body,
    metadata: overrides.metadata ?? {},
    viewCount: 1,
    likeCount: 0,
    commentCount: 0,
    seriesId: null,
    seriesOrder: null,
    author: { id: "u1", email: "a@example.com", name: "Author" },
    channel: {
      id: "ch1",
      slug: "notes",
      kind: "NOTES",
      layout: "TIMELINE",
      enabled: true,
      icon: null,
      accentColor: null,
      order: 0,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      translations: [
        {
          id: "ctr1",
          channelId: "ch1",
          locale: "zh",
          name: "Notes",
          description: null,
          tagline: null,
        },
      ],
    },
    series: null,
    tags: [],
    translations: [
      {
        id: "etr1",
        entryId: "entry-1",
        locale: "zh",
        title: "Entry title",
        excerpt: "Excerpt",
        content: body,
      },
    ],
  };
}
