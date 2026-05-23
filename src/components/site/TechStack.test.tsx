import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const techStackModulePath = "./TechStack";

describe("<TechStack />", () => {
  it("renders heading, intro, and all 5 category labels", async () => {
    render(await techStack());

    expect(screen.getByRole("heading", { level: 2, name: "技术体系" })).toBeInTheDocument();
    expect(
      screen.getByText("5 areas, 30+ pieces, all self-hosted."),
    ).toHaveClass("font-mono", "text-label", "tracking-label");

    expect(screen.getByText("FRONTEND")).toBeInTheDocument();
    expect(screen.getByText("CONTENT & EDITOR")).toBeInTheDocument();
    expect(screen.getByText("BACKEND & DATA")).toBeInTheDocument();
    expect(screen.getByText("INFRA")).toBeInTheDocument();
    expect(screen.getByText("TOOLING")).toBeInTheDocument();

    expect(screen.getByText("Next.js 16")).toBeInTheDocument();
    expect(screen.getByText("React 19")).toBeInTheDocument();
    expect(screen.getByText("TypeScript 5")).toBeInTheDocument();
    expect(screen.getByText("Tailwind CSS v4")).toBeInTheDocument();
    expect(screen.getByText("shadcn/ui")).toBeInTheDocument();
    expect(screen.getByText("Markdown source editor")).toBeInTheDocument();
    expect(screen.getByText("remark + rehype")).toBeInTheDocument();
    expect(screen.getByText("Shiki")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL 16")).toBeInTheDocument();
    expect(screen.getByText("Prisma 7")).toBeInTheDocument();
    expect(screen.getByText("Auth.js v5")).toBeInTheDocument();
    expect(screen.getByText("Zod")).toBeInTheDocument();
    expect(screen.getByText("MinIO")).toBeInTheDocument();
    expect(screen.getByText("Docker Compose")).toBeInTheDocument();
    expect(screen.getByText("Caddy")).toBeInTheDocument();
    expect(screen.getByText("Self-hosted VPS")).toBeInTheDocument();
    expect(screen.getByText("pnpm")).toBeInTheDocument();
    expect(screen.getByText("Vitest")).toBeInTheDocument();
    expect(screen.getByText("ESLint")).toBeInTheDocument();
    expect(screen.getByText("Playwright")).toBeInTheDocument();
  });

  it("each item shows hover tooltip with rationale", async () => {
    render(await techStack());

    const next = screen.getByText("Next.js 16").closest("abbr");
    expect(next).not.toBeNull();
    expect(next).toHaveAttribute(
      "title",
      "Next.js 16 — App Router + RSC + Server Actions",
    );
    expect(screen.getByText("Markdown source editor").closest("abbr")).toHaveAttribute(
      "title",
      "Markdown source editor — Split source + preview, never WYSIWYG round-trip",
    );
    expect(screen.getByText("Tailwind CSS v4").closest("abbr")).toHaveAttribute(
      "title",
      "Tailwind CSS v4 — CSS-vars driven theming",
    );

    const itemNames = screen.getAllByTestId("tech-stack-item-name");
    expect(itemNames.length).toBeGreaterThanOrEqual(30);
    expect(itemNames.every((item) => item.tagName === "ABBR")).toBe(true);
    expect(itemNames.every((item) => item.getAttribute("title")?.includes(" — "))).toBe(
      true,
    );
  });

  it("links to the About tech-stack section", async () => {
    render(await techStack());

    expect(
      screen.getByRole("link", { name: "完整技术选型理由 →" }),
    ).toHaveAttribute("href", "/about#tech-stack");
  });

  it("category labels have Editorial hairline styling", async () => {
    render(await techStack());

    const label = screen.getByText("FRONTEND");
    expect(label).toHaveClass("uppercase");
    expect(label).toHaveClass("text-muted-fg");
    expect(label).toHaveClass("text-label");
    expect(label).toHaveClass("tracking-label");
  });

  it("item grid uses responsive cols", async () => {
    render(await techStack());

    const frontend = screen.getByText("FRONTEND").closest("section");
    expect(frontend).not.toBeNull();
    const grid = frontend!.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-3");
  });

  it("rule line separators present", async () => {
    const { container } = render(await techStack());

    const rules = container.querySelectorAll(
      '[class*="border-t"][class*="border-border"]',
    );
    expect(rules.length).toBeGreaterThanOrEqual(4);
  });
});

async function techStack() {
  const { TechStack } = (await vi.importActual(techStackModulePath)) as {
    TechStack: ComponentType;
  };
  return <TechStack />;
}
