import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutHeroModulePath = "./AboutHero";

describe("<AboutHero />", () => {
  it("renders eyebrow, h1, lede, and now status", async () => {
    const { container } = render(
      await aboutHero({
        headline: "I build small systems and write down the tradeoffs.",
        lead:
          "A personal engineering log about full-stack systems, self-hosted infrastructure, and the parts of product work that deserve durable notes.",
      }),
    );

    expect(screen.getByText("ABOUT · ha1den")).toHaveClass("font-mono", "uppercase");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "I build small systems and write down the tradeoffs.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A personal engineering log about full-stack systems, self-hosted infrastructure, and the parts of product work that deserve durable notes.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Now: shipping TZBlog and documenting the tradeoffs")).toHaveClass(
      "font-mono",
      "uppercase",
    );
    expect(container.querySelector("[data-about-hero-surface]")).toHaveClass(
      "launch-surface",
      "about-hero-surface",
    );
    expect(container.querySelector("[data-hero-dot-grid]")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-reveal]").length).toBeGreaterThanOrEqual(4);
  });
});

async function aboutHero(props: {
  headline: string;
  lead: string;
}) {
  const { AboutHero } = (await vi.importActual(aboutHeroModulePath)) as {
    AboutHero: ComponentType<typeof props>;
  };

  return <AboutHero {...props} />;
}
