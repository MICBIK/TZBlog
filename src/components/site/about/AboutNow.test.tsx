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

  it("renders 4 columns: Shipping/Writing/Reading/Hardening", async () => {
    const { container } = render(
      await aboutNow({
        intro: "As of May 2026.",
        items: [
          {
            label: "Shipping",
            detail: "TZBlog from scratch with Next.js 16.",
          },
          {
            label: "Writing",
            detail: "Essays on type-driven design.",
          },
          {
            label: "Reading",
            detail: "Designing Data-Intensive Apps.",
          },
          {
            label: "Hardening",
            detail: "Postgres pg_dump pipeline.",
          },
        ],
      }),
    );

    expect(container.querySelectorAll("dt")).toHaveLength(4);
    expect(container.querySelectorAll("dd")).toHaveLength(4);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
    expect(screen.getByRole("heading", { level: 3, name: "Shipping" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Writing" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Reading" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Hardening" })).toBeInTheDocument();
    expect(container.querySelector("dd > h3 + p")).toBeInTheDocument();
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
