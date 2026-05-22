import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const heroModulePath = "./HeroEditorial";

describe("<HeroEditorial />", () => {
  it("renders single h1 with locked tagline + 2 CTA links (Read Blog / About)", async () => {
    render(await hero());

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(normalize(h1.textContent)).toContain(
      "Building things, one commit at a time.",
    );
    expect(h1.className).toContain("font-serif");
    expect(h1).toHaveClass("text-hero");

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Read Blog →" })).toHaveAttribute(
      "href",
      "/posts",
    );
    expect(screen.getByRole("link", { name: "About →" })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  it("root container has lg:grid-cols-[7fr_5fr] asymmetric grid", async () => {
    render(await hero());

    const root = screen.getByRole("heading", { level: 1 }).closest("section");
    expect(root).toHaveClass("grid");
    expect(root?.className).toContain("lg:grid-cols-[7fr_5fr]");
  });

  it("hairline label renders with uppercase tracking class", async () => {
    render(await hero());

    const label = screen.getByText("BLOG · ISSUE 002 · MAY 2026");
    expect(label).toHaveClass("uppercase");
    expect(label).toHaveClass("tracking-label");
    expect(label).toHaveClass("text-label");
  });

  it("dateline renders with serif italic className", async () => {
    render(await hero());

    const dateline = screen.getByText("ha1den · Notes from the field · May 2026");
    expect(dateline).toHaveClass("font-serif");
    expect(dateline).toHaveClass("italic");
  });

  it("rule line element exists with border-t border-border", async () => {
    const { container } = render(await hero());

    const rule = container.querySelector(
      '[class*="w-12"][class*="border-t"][class*="border-border"]',
    );
    expect(rule).toBeInTheDocument();
  });

  it("numbered marginalia exists in aside region", async () => {
    render(await hero());

    const marginalia = screen.getByText("001 / NOTES");
    expect(marginalia).toHaveClass("uppercase");
    expect(marginalia).toHaveClass("tracking-label");
  });

  it("hero children have data-reveal attribute with staggered --reveal-delay", async () => {
    const { container } = render(await hero());

    const reveals = Array.from(container.querySelectorAll("[data-reveal]"));
    const styles = reveals.map((el) => el.getAttribute("style") ?? "");

    expect(reveals.length).toBeGreaterThanOrEqual(6);
    expect(styles.some((style) => style.includes("--reveal-delay: 0ms"))).toBe(
      true,
    );
    expect(styles.some((style) => style.includes("--reveal-delay: 60ms"))).toBe(
      true,
    );
    expect(styles.some((style) => style.includes("--reveal-delay: 120ms"))).toBe(
      true,
    );
    expect(styles.some((style) => style.includes("--reveal-delay: 180ms"))).toBe(
      true,
    );
  });
});

async function hero() {
  const { HeroEditorial } = (await vi.importActual(heroModulePath)) as {
    HeroEditorial: ComponentType;
  };
  return <HeroEditorial />;
}

function normalize(value: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}
