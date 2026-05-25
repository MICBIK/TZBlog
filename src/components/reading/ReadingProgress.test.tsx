import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReadingProgress } from "./ReadingProgress";

describe("ReadingProgress", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
      writable: true,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  it("progressBarTracksScroll", () => {
    const article = document.createElement("article");
    article.setAttribute("data-article-reader", "true");
    document.body.appendChild(article);

    vi.spyOn(article, "getBoundingClientRect").mockReturnValue({
      top: -400,
      height: 1600,
      bottom: 1200,
      left: 0,
      right: 0,
      width: 800,
      x: 0,
      y: -400,
      toJSON: () => ({}),
    });

    render(<ReadingProgress targetSelector="[data-article-reader]" />);

    const bar = screen.getByTestId("reading-progress");
    const fill = bar.querySelector("[data-reading-progress-bar]");

    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(fill).toHaveStyle({ transform: "scaleX(0.5)" });

    act(() => {
      vi.spyOn(article, "getBoundingClientRect").mockReturnValue({
        top: -800,
        height: 1600,
        bottom: 800,
        left: 0,
        right: 0,
        width: 800,
        x: 0,
        y: -800,
        toJSON: () => ({}),
      });
      fireEvent.scroll(window);
    });

    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(fill).toHaveStyle({ transform: "scaleX(1)" });

    document.body.removeChild(article);
  });
});
