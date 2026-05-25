import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicEntry } from "@/lib/services/entryPublic";

const mocks = vi.hoisted(() => ({
  getCurrentLocale: vi.fn(),
  getNextEntrySuggestion: vi.fn(),
}));

vi.mock("@/lib/i18n", () => ({
  getCurrentLocale: mocks.getCurrentLocale,
}));

vi.mock("@/lib/services/entryPublic", () => ({
  getNextEntrySuggestion: mocks.getNextEntrySuggestion,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentLocale.mockReturnValue("zh");
});

describe("NextEntry", () => {
  it("seriesEntryShowsSeriesNextChapterLabel", async () => {
    mocks.getNextEntrySuggestion.mockResolvedValue({
      kind: "series",
      title: "Chapter Two",
      href: "/posts/chapter-two",
      seriesOrder: 2,
    });

    const { NextEntry } = await import("./NextEntry");
    render(await NextEntry({ entry: baseEntry() }));

    expect(screen.getByText("系列下一篇 · 第 2 章")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chapter Two" })).toHaveAttribute(
      "href",
      "/posts/chapter-two",
    );
  });

  it("similarTagsShowInterestLabel", async () => {
    mocks.getNextEntrySuggestion.mockResolvedValue({
      kind: "similar",
      title: "Related post",
      href: "/c/stream/related",
    });

    const { NextEntry } = await import("./NextEntry");
    render(await NextEntry({ entry: baseEntry() }));

    expect(screen.getByText("你可能感兴趣")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Related post" })).toHaveAttribute(
      "href",
      "/c/stream/related",
    );
  });

  it("isolatedEntryShowsRecentArticlesLabel", async () => {
    mocks.getNextEntrySuggestion.mockResolvedValue({
      kind: "recent",
      title: "Latest in channel",
      href: "/c/stream/latest",
    });

    const { NextEntry } = await import("./NextEntry");
    render(await NextEntry({ entry: baseEntry() }));

    expect(screen.getByText("近期文章")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Latest in channel" })).toHaveAttribute(
      "href",
      "/c/stream/latest",
    );
  });
});

function baseEntry(): PublicEntry {
  return {
    id: "entry-1",
    slug: "current",
    kind: "NOTE",
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
      kind: "STREAM",
      layout: "GREP",
      enabled: true,
      icon: null,
      accentColor: null,
      order: 0,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      translations: [],
    },
    series: null,
    tags: [],
    translations: [
      {
        id: "etr1",
        entryId: "entry-1",
        locale: "zh",
        title: "Current",
        excerpt: null,
        content: "body",
      },
    ],
  };
}
