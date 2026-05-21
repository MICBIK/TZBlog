import { act, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TocHeading } from "@/lib/markdown";

type PostTocModule = {
  PostToc: ComponentType<{ headings: TocHeading[] }>;
};

const headings: TocHeading[] = [
  { id: "a", text: "A", level: 2 },
  { id: "a1", text: "A1", level: 3 },
  { id: "b", text: "B", level: 2 },
];

const observerState = vi.hoisted(() => ({
  callback: null as IntersectionObserverCallback | null,
  disconnect: vi.fn(),
  observe: vi.fn(),
}));

async function loadPostToc(): Promise<PostTocModule> {
  const modulePath = "./PostToc";
  return (await import(modulePath)) as PostTocModule;
}

beforeEach(() => {
  vi.clearAllMocks();
  observerState.callback = null;

  class MockIntersectionObserver {
    root = null;
    rootMargin = "";
    thresholds = [];
    observe = observerState.observe;
    disconnect = observerState.disconnect;
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);

    constructor(callback: IntersectionObserverCallback) {
      observerState.callback = callback;
    }
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

describe("PostToc", () => {
  it("renders nested list with h3 indented", async () => {
    const { PostToc } = await loadPostToc();

    render(<PostToc headings={headings} />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#a",
      "#a1",
      "#b",
    ]);
    expect(links.map((link) => link.textContent)).toEqual(["A", "A1", "B"]);
    expect(screen.getByRole("link", { name: "A" }).closest("li")).not.toHaveClass(
      "pl-3",
    );
    expect(screen.getByRole("link", { name: "A1" }).closest("li")).toHaveClass(
      "pl-3",
    );
    expect(screen.getByRole("link", { name: "B" }).closest("li")).not.toHaveClass(
      "pl-3",
    );
  });

  it("renders nothing when headings empty", async () => {
    const { PostToc } = await loadPostToc();

    render(<PostToc headings={[]} />);

    expect(screen.queryByTestId("post-toc")).toBeNull();
  });

  it("highlights active heading from IO callback and disconnects on unmount", async () => {
    const { PostToc } = await loadPostToc();
    const { unmount } = render(<PostToc headings={headings} />);

    act(() => {
      observerState.callback?.(
        [
          {
            isIntersecting: true,
            target: { id: "a1" } as Element,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(screen.getByRole("link", { name: "A1" })).toHaveClass("text-fg");
    expect(screen.getByRole("link", { name: "A" })).not.toHaveClass("text-fg");
    expect(screen.getByRole("link", { name: "B" })).not.toHaveClass("text-fg");

    unmount();

    expect(observerState.disconnect).toHaveBeenCalledTimes(1);
  });
});
