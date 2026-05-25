import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { FeedLayout } from "./FeedLayout";
import type { ChannelLayoutEntry } from "./types";

const thirtyEntries: ChannelLayoutEntry[] = Array.from({ length: 30 }, (_, index) => ({
  id: `f${index}`,
  slug: `stream-${index}`,
  kind: "NOTE",
  publishedAt: new Date(`2026-05-${String((index % 28) + 1).padStart(2, "0")}T08:00:00Z`),
  title: `流 ${index}`,
  excerpt: `body ${index}`,
  metadata: {},
}));

describe("FeedLayout", () => {
  let observerCallback: IntersectionObserverCallback | null = null;

  beforeEach(() => {
    observerCallback = null;
    class IntersectionObserverMock {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rendersMasonryFlow", () => {
    render(<FeedLayout channelSlug="stream" entries={thirtyEntries.slice(0, 12)} />);

    const layout = screen.getByTestId("feed-layout");
    expect(layout).toHaveClass("[column-count:1]");
    expect(layout).toHaveClass("md:[column-count:2]");
    expect(screen.getAllByTestId("feed-entry")).toHaveLength(12);
  });

  it("infiniteScrollLoadsNextBatch", () => {
    render(<FeedLayout channelSlug="stream" entries={thirtyEntries} batchSize={12} />);

    expect(screen.getAllByTestId("feed-entry")).toHaveLength(12);

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(screen.getAllByTestId("feed-entry").length).toBeGreaterThan(12);
  });
});
