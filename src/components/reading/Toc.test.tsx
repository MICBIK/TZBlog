import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TocHeading } from "@/lib/markdown";

import { Toc } from "./Toc";

const headings: TocHeading[] = [
  { id: "intro", text: "Intro", level: 2 },
  { id: "details", text: "Details", level: 3 },
];

beforeEach(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    constructor(_observer: IntersectionObserverCallback) {
      void _observer;
    }
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

describe("Toc", () => {
  it("tocAppearsForLongArticles", () => {
    render(
      <Toc
        headings={headings}
        contentLength={1200}
        placement="both"
      />,
    );

    expect(screen.getByTestId("reading-toc-mobile")).toBeInTheDocument();
    expect(screen.getAllByTestId("reading-toc").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Intro" })).toBeInTheDocument();
  });

  it("does not render toc for short articles", () => {
    render(
      <Toc
        headings={headings}
        contentLength={500}
        placement="both"
      />,
    );

    expect(screen.queryByTestId("reading-toc")).toBeNull();
  });

  it("tocItemClickScrollsToHeading", () => {
    const target = document.createElement("h2");
    target.id = "intro";
    document.body.appendChild(target);

    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    render(
      <Toc
        headings={headings}
        contentLength={1500}
        placement="both"
      />,
    );

    fireEvent.click(screen.getAllByRole("link", { name: "Intro" })[0]);

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });

    document.body.removeChild(target);
  });
});
