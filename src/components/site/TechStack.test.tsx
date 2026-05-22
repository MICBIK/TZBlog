import { render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const techStackModulePath = "./TechStack";

describe("<TechStack />", () => {
  it("TechStack renders all 5 category labels and items", async () => {
    render(await techStack());

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

  it("each item renders with name + note", async () => {
    render(await techStack());

    const next = screen.getByText("Next.js 16").closest("div");
    expect(next).not.toBeNull();
    expect(within(next!).getByText("App Router + RSC + Server Actions")).toBeInTheDocument();
    expect(screen.getByText("split source + preview")).toBeInTheDocument();
    expect(screen.getByText("with strict mode")).toBeInTheDocument();
    expect(screen.getByText("CSS-vars driven theming")).toBeInTheDocument();
  });

  it("category labels have Editorial hairline styling", async () => {
    render(await techStack());

    const label = screen.getByText("FRONTEND");
    expect(label).toHaveClass("uppercase");
    expect(label).toHaveClass("text-muted-fg");
    expect(label.className).toContain("text-[var(--text-label)]");
    expect(label.className).toContain("tracking-[var(--tracking-label)]");
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
