import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

const launchNarrativeModulePath = "./LaunchNarrative";

describe("<LaunchNarrative />", () => {
  it("LaunchNarrative renders launch narrative cards with project direction", async () => {
    const { container } = render(await launchNarrative());

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "A self-hosted publishing system, built in public.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("ARCHITECTURE")).toBeInTheDocument();
    expect(screen.getByText("EDITORIAL PIPELINE")).toBeInTheDocument();
    expect(screen.getByText("OPERATIONS")).toBeInTheDocument();
    expect(screen.getByText(/Next.js App Router/)).toBeInTheDocument();
    expect(screen.getByText(/remark\/rehype/)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL, MinIO, and Caddy/)).toBeInTheDocument();

    const cards = container.querySelectorAll(".launch-panel");
    expect(cards).toHaveLength(3);
    expect(container.querySelector("[data-launch-orbit]")).toBeInTheDocument();
  });
});

async function launchNarrative() {
  const { LaunchNarrative } = (await vi.importActual(
    launchNarrativeModulePath,
  )) as {
    LaunchNarrative: ComponentType;
  };

  return <LaunchNarrative />;
}
