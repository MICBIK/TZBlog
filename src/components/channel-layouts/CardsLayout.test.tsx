import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CardsLayout } from "./CardsLayout";
import type { ChannelLayoutEntry } from "./types";

function makeEntry(index: number): ChannelLayoutEntry {
  return {
    id: `entry-${index}`,
    slug: `card-${index}`,
    kind: "ARTICLE",
    publishedAt: new Date(`2026-05-${String(index).padStart(2, "0")}T08:00:00Z`),
    title: `卡片 ${index}`,
    excerpt: `摘要 ${index}`,
    metadata: { cover: `/uploads/cover-${index}.png` },
  };
}

const nineEntries = Array.from({ length: 9 }, (_, index) =>
  makeEntry(index + 1),
);

describe("CardsLayout", () => {
  it("rendersResponsiveGridDesktop3Mobile1", () => {
    render(<CardsLayout channelSlug="articles" entries={nineEntries} />);

    const grid = screen.getByTestId("cards-layout");
    expect(grid).toHaveClass("grid-cols-1");
    expect(grid).toHaveClass("md:grid-cols-2");
    expect(grid).toHaveClass("lg:grid-cols-3");
    expect(screen.getAllByTestId("cards-entry")).toHaveLength(9);
  });

  it("cardHoverShowsAccentBorder", () => {
    render(
      <CardsLayout channelSlug="articles" entries={[makeEntry(1)]} />,
    );

    expect(screen.getByTestId("cards-entry")).toHaveAttribute(
      "data-interactive-surface",
      "cards-entry",
    );
  });
});
