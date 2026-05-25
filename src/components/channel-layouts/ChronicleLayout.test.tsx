import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChronicleLayout } from "./ChronicleLayout";
import type { ChannelLayoutEntry } from "./types";

function makeEntry(
  index: number,
  overrides: Partial<ChannelLayoutEntry> = {},
): ChannelLayoutEntry {
  return {
    id: `entry-${index}`,
    slug: `post-${index}`,
    kind: "ARTICLE",
    publishedAt: new Date(`2026-05-${String(index).padStart(2, "0")}T08:00:00Z`),
    title: `长文标题 ${index}`,
    excerpt: `摘要 ${index}`,
    metadata: {
      cover: `/uploads/2026/05/cover-${index}.png`,
      readingMinutes: index + 3,
    },
    ...overrides,
  };
}

const fiveEntries = Array.from({ length: 5 }, (_, index) =>
  makeEntry(index + 1),
);

describe("ChronicleLayout", () => {
  it("rendersSingleColumnLongFormStream", () => {
    render(
      <ChronicleLayout channelSlug="articles" entries={fiveEntries} />,
    );

    expect(screen.getByTestId("chronicle-layout")).toBeInTheDocument();
    expect(screen.getByTestId("chronicle-layout")).toHaveAttribute(
      "data-layout",
      "chronicle",
    );

    const cards = screen.getAllByTestId("chronicle-entry");
    expect(cards).toHaveLength(5);

    expect(screen.getByRole("link", { name: "长文标题 1" })).toHaveAttribute(
      "href",
      "/posts/post-1",
    );
    expect(screen.getByText("摘要 1")).toBeInTheDocument();
    expect(screen.getByText("4 分钟阅读")).toBeInTheDocument();
    const firstEntry = screen.getAllByTestId("chronicle-entry")[0];
    expect(
      firstEntry.querySelector('[data-testid="chronicle-cover"] img'),
    ).toHaveAttribute("src", "/uploads/2026/05/cover-1.png");
  });

  it("rendersPlaceholderWhenCoverMissing", () => {
    render(
      <ChronicleLayout
        channelSlug="articles"
        entries={[makeEntry(1, { metadata: { readingMinutes: 6 } })]}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("chronicle-cover-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("chronicle-entry")).toHaveAttribute(
      "data-cover-state",
      "no-cover",
    );
  });

  it("rendersEmptyStateWhenNoPublishedEntries", () => {
    render(<ChronicleLayout channelSlug="articles" entries={[]} />);

    expect(screen.getByTestId("chronicle-empty-state")).toHaveTextContent(
      "这个频道还没有发布内容。",
    );
    expect(screen.queryByTestId("chronicle-entry")).not.toBeInTheDocument();
  });
});
