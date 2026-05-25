import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/site/GithubCard", () => ({ GithubCard: () => null }));
vi.mock("@/components/site/HomeColumns", () => ({ HomeColumns: () => null }));
vi.mock("@/components/site/HomeFeaturedAndRecent", () => ({ HomeFeaturedAndRecent: () => null }));
vi.mock("@/components/site/HomeHero", () => ({ HomeHero: () => <div data-testid="home-hero" /> }));
vi.mock("@/components/site/HomePrinciples", () => ({ HomePrinciples: () => null }));
vi.mock("@/components/site/HomeStats", () => ({ HomeStats: () => null }));
vi.mock("@/components/site/TechStack", () => ({ TechStack: () => null }));
vi.mock("@/components/site/HomeShell", () => ({
  HomeShell: ({ hero }: { hero: React.ReactNode }) => <div>{hero}</div>,
}));

import HomePage from "./page";

describe("HomePage public shell", () => {
  it("auroraHeroAttributeEnablesGlowLayer", () => {
    render(<HomePage />);

    expect(
      screen.getByTestId("home-hero").closest("[data-theme='aurora'][data-hero='true']"),
    ).toBeTruthy();
  });
});
