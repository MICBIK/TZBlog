import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "./ThemeProvider";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

describe("ThemeProvider", () => {
  it("rootHasAuroraThemeByDefault", () => {
    render(
      <ThemeProvider theme="aurora">
        <p>content</p>
      </ThemeProvider>,
    );

    expect(screen.getByText("content").closest("[data-theme='aurora']")).toBeTruthy();
  });

  it("postSlugRouteResolvesToInkTheme", () => {
    render(
      <ThemeProvider theme="ink">
        <article>article body</article>
      </ThemeProvider>,
    );

    expect(
      screen.getByText("article body").closest("[data-theme='ink']"),
    ).toBeTruthy();
  });

  it("auroraHeroAttributeEnablesGlowLayer", () => {
    render(
      <ThemeProvider theme="aurora" hero>
        <div data-testid="hero-root">hero</div>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("hero-root").closest("[data-theme='aurora']")).toHaveAttribute(
      "data-hero",
      "true",
    );
  });

  it("postPageHasNoAuroraLayer", () => {
    render(
      <ThemeProvider theme="ink">
        <div data-testid="post-root">post</div>
      </ThemeProvider>,
    );

    const wrapper = screen.getByTestId("post-root").closest("[data-theme='ink']");
    expect(wrapper).toBeTruthy();
    expect(wrapper).not.toHaveAttribute("data-hero");
  });

  it("reducedMotionDisablesAuroraDrift", () => {
    render(
      <ThemeProvider theme="aurora" hero>
        <div data-testid="hero">hero</div>
      </ThemeProvider>,
    );

    const wrapper = screen.getByTestId("hero").closest("[data-theme='aurora']");
    expect(wrapper).toHaveAttribute("data-hero", "true");
    expect(wrapper).toHaveAttribute("data-reduced-motion-safe");
  });
});
