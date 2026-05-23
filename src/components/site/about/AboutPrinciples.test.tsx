import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutPrinciplesModulePath = "./AboutPrinciples";

describe("<AboutPrinciples />", () => {
  it("AboutPrinciples renders architecture and writing principles", async () => {
    const { container } = render(
      await aboutPrinciples({
        intro: "The project is built around small, inspectable systems.",
        items: [
          {
            label: "Source-first",
            detail: "Markdown remains the canonical authoring format.",
          },
          {
            label: "Operational ownership",
            detail: "Deployment keeps app, database, storage, and proxy visible.",
          },
        ],
      }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Principles" }),
    ).toBeInTheDocument();
    expect(screen.getByText("PRINCIPLES")).toBeInTheDocument();
    expect(screen.getByText("Source-first")).toBeInTheDocument();
    expect(
      screen.getByText("Markdown remains the canonical authoring format."),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".launch-panel")).toHaveLength(2);
  });

  it("renders 6-8 principle cards", async () => {
    const { container } = render(
      await aboutPrinciples({
        intro: "The project is built around visible engineering tradeoffs.",
        items: Array.from({ length: 8 }, (_, index) => ({
          label: `Principle ${index + 1}`,
          detail: `Detail ${index + 1}`,
        })),
      }),
    );

    const cards = container.querySelectorAll(".launch-panel");
    const grid = cards[0]?.parentElement;

    expect(cards.length).toBeGreaterThanOrEqual(6);
    expect(cards.length).toBeLessThanOrEqual(8);
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-3");
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Principle 1" })).toBeInTheDocument();
  });
});

async function aboutPrinciples(props: {
  intro: string;
  items: Array<{
    label: string;
    detail: string;
  }>;
}) {
  const { AboutPrinciples } = (await vi.importActual(
    aboutPrinciplesModulePath,
  )) as {
    AboutPrinciples: ComponentType<typeof props>;
  };

  return <AboutPrinciples {...props} />;
}
