import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutStoryModulePath = "./AboutStory";

describe("<AboutStory />", () => {
  it("AboutStory renders prose paragraphs", async () => {
    const { container } = render(
      await aboutStory({
        paragraphs: [
          "Placeholder: I started building things on the web in [year].",
          "Placeholder: These days I focus on shipping small, well-made things.",
        ],
      }),
    );

    expect(screen.getByText("STORY")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Story" })).toBeInTheDocument();
    expect(
      screen.getByText("Placeholder: I started building things on the web in [year]."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Placeholder: These days I focus on shipping small, well-made things."),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(3);
    expect(
      screen.getByText("Placeholder: I started building things on the web in [year].").className,
    ).toContain("max-w-[65ch]");
  });
});

async function aboutStory(props: { paragraphs: string[] }) {
  const { AboutStory } = (await vi.importActual(aboutStoryModulePath)) as {
    AboutStory: ComponentType<typeof props>;
  };

  return <AboutStory {...props} />;
}
