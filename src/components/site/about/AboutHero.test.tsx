import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutHeroModulePath = "./AboutHero";

describe("<AboutHero />", () => {
  it("AboutHero renders headline + lead + ABOUT label", async () => {
    render(
      await aboutHero({
        headline: "Building things people read.",
        lead: "Placeholder: shipping notes from the field.",
      }),
    );

    expect(screen.getByText("ABOUT")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Building things people read.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Placeholder: shipping notes from the field."),
    ).toBeInTheDocument();
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
