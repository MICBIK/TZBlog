import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicEntry } from "@/lib/services/entryPublic";

const mocks = vi.hoisted(() => ({
  getCurrentLocale: vi.fn(),
  getPublishedEntryInChannel: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
  renderMarkdown: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));

vi.mock("@/lib/i18n", () => ({
  DEFAULT_LOCALE: "zh",
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/entryPublic", () => ({
  getPublishedEntryInChannel: mocks.getPublishedEntryInChannel,
  pickEntryTranslation: (
    entry: PublicEntry,
    locale: string,
  ) =>
    entry.translations.find((row) => row.locale === locale) ??
    entry.translations[0],
}));

vi.mock("@/lib/markdown", () => ({
  renderMarkdown: mocks.renderMarkdown,
}));

vi.mock("@/components/site/EntryDetail", () => ({
  EntryDetail: ({ entry }: { entry: PublicEntry }) => (
    <div data-testid="entry-detail" data-entry-kind={entry.kind} />
  ),
}));

vi.mock("@/components/site/NextEntry", () => ({
  NextEntry: () => <div data-testid="next-entry" />,
}));

vi.mock("@/components/terminal/TerminalShell", () => ({
  TerminalShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="terminal-shell">{children}</div>
  ),
}));

vi.mock("@/components/terminal/TerminalEntryDetail", () => ({
  TerminalEntryDetail: () => <div data-testid="terminal-entry-detail" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
  mocks.renderMarkdown.mockResolvedValue("<p>body</p>");
  mocks.notFound.mockImplementation(() => {
    throw new Error("NOT_FOUND");
  });
  mocks.redirect.mockImplementation(() => {
    throw new Error("REDIRECT");
  });
});

describe("ChannelEntryDetailPage routing", () => {
  it("noteEntryRendersOnChannelRoute", async () => {
    mocks.getPublishedEntryInChannel.mockResolvedValue(
      entryFixture({ kind: "NOTE", slug: "daily-note", channelKind: "NOTES" }),
    );

    const { default: Page } = await import("./page");
    render(
      await Page({
        params: Promise.resolve({ slug: "notes", "entry-slug": "daily-note" }),
      }),
    );

    expect(screen.getByTestId("entry-detail")).toHaveAttribute(
      "data-entry-kind",
      "NOTE",
    );
  });

  it("articleAtChannelRouteRedirectsToPosts", async () => {
    mocks.getPublishedEntryInChannel.mockResolvedValue(
      entryFixture({ kind: "ARTICLE", slug: "why-i-rewrote" }),
    );

    const { default: Page } = await import("./page");

    await expect(
      Page({
        params: Promise.resolve({
          slug: "articles",
          "entry-slug": "why-i-rewrote",
        }),
      }),
    ).rejects.toThrow("REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledWith("/posts/why-i-rewrote");
  });

  it("linkEntryRendersLinkCardLayout", async () => {
    mocks.getPublishedEntryInChannel.mockResolvedValue(
      entryFixture({
        kind: "LINK",
        slug: "link-postgres-locks",
        channelKind: "STREAM",
      }),
    );

    const { default: Page } = await import("./page");
    render(
      await Page({
        params: Promise.resolve({
          slug: "stream",
          "entry-slug": "link-postgres-locks",
        }),
      }),
    );

    expect(screen.getByTestId("entry-detail")).toHaveAttribute(
      "data-entry-kind",
      "LINK",
    );
    expect(screen.getByTestId("next-entry")).toBeInTheDocument();
    expect(screen.queryByTestId("terminal-entry-detail")).not.toBeInTheDocument();
  });

  it("guestbookThreadAtChannelRouteReturns404", async () => {
    mocks.getPublishedEntryInChannel.mockResolvedValue(
      entryFixture({ kind: "GUESTBOOK_THREAD", slug: "thread-1" }),
    );

    const { default: Page } = await import("./page");

    await expect(
      Page({
        params: Promise.resolve({
          slug: "guestbook",
          "entry-slug": "thread-1",
        }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });
});

function entryFixture(
  overrides: Partial<{
    kind: PublicEntry["kind"];
    slug: string;
    channelKind: PublicEntry["channel"]["kind"];
  }> = {},
): PublicEntry {
  return {
    id: "entry-1",
    slug: overrides.slug ?? "entry-slug",
    kind: overrides.kind ?? "NOTE",
    status: "PUBLISHED",
    publishedAt: new Date("2026-05-21T00:00:00Z"),
    body: "body",
    metadata: {},
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    seriesId: null,
    seriesOrder: null,
    author: { id: "u1", email: "a@example.com", name: "Author" },
    channel: {
      id: "ch1",
      slug: "stream",
      kind: overrides.channelKind ?? "STREAM",
      layout: "GREP",
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
          name: "Stream",
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
        title: "Title",
        excerpt: "Excerpt",
        content: "body",
      },
    ],
  };
}
