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
