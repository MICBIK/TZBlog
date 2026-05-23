import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const heroModulePath = "./HomeHero";

describe("<HomeHero />", () => {
  it("renders eyebrow, title, lede, dual CTA, and now status", async () => {
    render(await hero());

    expect(screen.getByText("NOTES · v0.x · MAY 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /个人.*工程.*克制/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/个人.*工程.*克制/)).toHaveClass("hero-title");
    expect(screen.getByText(/source-first|Markdown/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "阅读文章" })).toHaveAttribute(
      "href",
      "/posts",
    );
    expect(screen.getByRole("link", { name: "关于我" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.getByText(/^Now:/)).toBeInTheDocument();
  });

  it("uses launch surface, dot grid, and grain overlay classes", async () => {
    const { container } = render(await hero());

    expect(container.querySelector(".launch-surface")).toBeInTheDocument();
    expect(container.querySelector("[data-hero-dot-grid]")).toBeInTheDocument();
    expect(container.querySelector("[data-hero-grain]")).toBeInTheDocument();
    expect(container.querySelector(".hero-divider")).toBeInTheDocument();
  });

  it("applies staggered reveal classes to hero content", async () => {
    const { container } = render(await hero());

    const reveals = Array.from(container.querySelectorAll("[data-reveal]"));
    expect(reveals.length).toBeGreaterThanOrEqual(4);
    expect(reveals.map((el) => el.getAttribute("style") ?? "")).toEqual(
      expect.arrayContaining([
        expect.stringContaining("--reveal-delay: 0ms"),
        expect.stringContaining("--reveal-delay: 100ms"),
        expect.stringContaining("--reveal-delay: 200ms"),
        expect.stringContaining("--reveal-delay: 300ms"),
      ]),
    );
  });

  it("respects reduced motion by keeping reveal hooks class-based", async () => {
    render(await hero());

    expect(document.querySelector("[data-reveal]")).toBeTruthy();
  });
});

async function hero() {
  const { HomeHero } = (await vi.importActual(heroModulePath)) as {
    HomeHero: ComponentType;
  };
  return <HomeHero />;
}
