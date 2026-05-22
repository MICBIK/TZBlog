import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutNowModulePath = "./AboutNow";

describe("<AboutNow />", () => {
  it("AboutNow renders intro + items list", async () => {
    const { container } = render(
      await aboutNow({
        intro: "Placeholder: As of May 2026.",
        items: [
          {
            label: "Shipping",
            detail: "TZBlog from scratch.",
          },
          {
            label: "Reading",
            detail: "Designing Data-Intensive Applications.",
          },
        ],
      }),
    );

    expect(screen.getByText("NOW")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Now" })).toBeInTheDocument();
    expect(screen.getByText("Placeholder: As of May 2026.")).toBeInTheDocument();
    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(screen.getByText("TZBlog from scratch.")).toBeInTheDocument();
    expect(container.querySelector("dl")).toBeInTheDocument();
    expect(container.querySelectorAll("dt")).toHaveLength(2);
    expect(container.querySelectorAll("dd")).toHaveLength(2);
  });
});

async function aboutNow(props: {
  intro: string;
  items: Array<{
    label: string;
    detail: string;
  }>;
}) {
  const { AboutNow } = (await vi.importActual(aboutNowModulePath)) as {
    AboutNow: ComponentType<typeof props>;
  };

  return <AboutNow {...props} />;
}
