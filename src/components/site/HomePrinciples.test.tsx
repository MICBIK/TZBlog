import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const modulePath = "./HomePrinciples";

describe("<HomePrinciples />", () => {
  it("renders 4 principle cards with mono numbers", async () => {
    const { container } = render(await homePrinciples());

    expect(
      screen.getByRole("heading", { level: 2, name: "原则" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".launch-panel")).toHaveLength(4);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
    expect(screen.getByText("Source-first publishing")).toBeInTheDocument();
    expect(screen.getByText("Markdown is the source")).toBeInTheDocument();
    expect(screen.getByText("Document tradeoffs")).toBeInTheDocument();
    expect(screen.getByText("Self-host the whole loop")).toBeInTheDocument();
  });

  it("uses launch-panel cards with reveal hooks", async () => {
    const { container } = render(await homePrinciples());

    const cards = Array.from(container.querySelectorAll(".launch-panel"));
    expect(cards.every((card) => card.hasAttribute("data-reveal"))).toBe(true);
  });
});

async function homePrinciples() {
  const { HomePrinciples } = (await vi.importActual(modulePath)) as {
    HomePrinciples: ComponentType;
  };
  return <HomePrinciples />;
}
