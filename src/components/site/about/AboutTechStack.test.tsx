import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutTechStackModulePath = "./AboutTechStack";

describe("<AboutTechStack />", () => {
  it("renders all 5 categories with rationale per item", async () => {
    const { container } = render(await aboutTechStack());

    expect(
      screen.getByRole("heading", { level: 2, name: "Technology choices" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Frontend" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Content & Editor" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Backend & Data" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Infra" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Tooling" })).toBeInTheDocument();

    const terms = container.querySelectorAll("dt");
    const definitions = container.querySelectorAll("dd");
    expect(terms.length).toBeGreaterThanOrEqual(30);
    expect(definitions.length).toBe(terms.length);
    expect(screen.getByText("Next.js 16")).toBeInTheDocument();
    expect(screen.getByText("CodeMirror 6")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL 16")).toBeInTheDocument();
    expect(screen.getByText("Caddy")).toBeInTheDocument();
    expect(screen.getByText("SDD artifacts")).toBeInTheDocument();
  });

  it("section has id=tech-stack for hash anchor", async () => {
    const { container } = render(await aboutTechStack());

    const section = container.querySelector("section#tech-stack");
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute("aria-labelledby", "about-tech-stack-heading");
  });
});

async function aboutTechStack() {
  const { AboutTechStack } = (await vi.importActual(
    aboutTechStackModulePath,
  )) as {
    AboutTechStack: ComponentType;
  };

  return <AboutTechStack />;
}
