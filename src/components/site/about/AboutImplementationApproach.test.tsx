import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const aboutImplementationApproachModulePath = "./AboutImplementationApproach";

describe("<AboutImplementationApproach />", () => {
  it("renders 4 methodology entries", async () => {
    const { container } = render(
      await aboutImplementationApproach({
        entries: methodologyEntries,
      }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Implementation approach" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "SDD + TDD micro-cycles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Self-hosted CMS over CMS-as-a-service",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Markdown is the source of truth" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Document tradeoffs in memory-bank" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("article.launch-panel")).toHaveLength(4);
  });

  it("methodology entries render code snippet visually", async () => {
    const { container } = render(
      await aboutImplementationApproach({
        entries: methodologyEntries,
      }),
    );

    const snippet = container.querySelector("pre.shiki");
    expect(snippet).toBeInTheDocument();
    expect(snippet).toHaveTextContent("test(about): A-6");
    expect(snippet).toHaveTextContent("feat(about): A-6");
  });
});

const methodologyEntries = [
  {
    label: "01",
    heading: "SDD + TDD micro-cycles",
    body:
      "Each capability starts with a spec, a real failing test, and a matching implementation commit.",
    code: "test(about): A-6\nfeat(about): A-6",
  },
  {
    label: "02",
    heading: "Self-hosted CMS over CMS-as-a-service",
    body:
      "The CMS is small enough to audit, and avoids platform lock-in from hosted publishing tools.",
  },
  {
    label: "03",
    heading: "Markdown is the source of truth",
    body:
      "Editing stays as Markdown source while preview and published pages share the rendering pipeline.",
  },
  {
    label: "04",
    heading: "Document tradeoffs in memory-bank",
    body:
      "Durable context lives in memory-bank so future SDD work starts from recorded decisions.",
  },
];

async function aboutImplementationApproach(props: {
  entries: Array<{
    label: string;
    heading: string;
    body: string;
    code?: string;
  }>;
}) {
  const { AboutImplementationApproach } = (await vi.importActual(
    aboutImplementationApproachModulePath,
  )) as {
    AboutImplementationApproach: ComponentType<typeof props>;
  };

  return <AboutImplementationApproach {...props} />;
}
