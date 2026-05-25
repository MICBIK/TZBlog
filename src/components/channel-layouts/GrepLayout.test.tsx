import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { GrepLayout } from "./GrepLayout";
import type { ChannelLayoutEntry } from "./types";

const entries: ChannelLayoutEntry[] = Array.from({ length: 20 }, (_, index) => ({
  id: `g${index}`,
  slug: `link-${index}`,
  kind: "LINK",
  publishedAt: new Date(`2026-05-${String((index % 28) + 1).padStart(2, "0")}T08:00:00Z`),
  title: `链接 ${index}`,
  excerpt: `desc ${index}`,
  metadata: {
    sourceUrl: `https://example.com/${index}`,
    domain: "example.com",
  },
}));

describe("GrepLayout", () => {
  it("rendersMonospaceTableWithSearchInput", () => {
    render(<GrepLayout channelSlug="links" entries={entries} />);

    expect(screen.getByTestId("grep-layout")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "筛选条目" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveClass("font-mono");
    expect(screen.getAllByTestId("grep-row")).toHaveLength(20);
  });

  it("searchInputFiltersRowsLive", async () => {
    const user = userEvent.setup();
    render(<GrepLayout channelSlug="links" entries={entries} />);

    await user.type(screen.getByRole("searchbox", { name: "筛选条目" }), "链接 3");

    const visibleRows = screen
      .getAllByTestId("grep-row")
      .filter((row) => !row.classList.contains("hidden"));
    expect(visibleRows.length).toBeGreaterThan(0);
    expect(visibleRows.length).toBeLessThan(20);
    expect(screen.getByText("链接 3")).toBeVisible();
  });
});
