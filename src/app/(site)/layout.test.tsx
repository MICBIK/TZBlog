import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteShell } from "@/components/site/SiteShell";

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));
vi.mock("@/components/site/AnalyticsBeacon", () => ({
  AnalyticsBeacon: () => <div data-testid="analytics-beacon" />,
}));

describe("<SiteLayout /> public shell", () => {
  it("renders3PartShellHeaderMainFooter", () => {
    render(
      <SiteShell channels={[]}>
        <p>child</p>
      </SiteShell>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("renders <AnalyticsBeacon /> alongside header/footer/toaster + children", () => {
    render(
      <SiteShell channels={[]}>
        <p>child</p>
      </SiteShell>,
    );

    expect(screen.getByTestId("analytics-beacon")).toBeInTheDocument();
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("rendersMotionEnhancedContentWithoutHydrationOnlyVisibility", () => {
    const { container } = render(
      <SiteShell channels={[]}>
        <section data-reveal>SSR visible child</section>
      </SiteShell>,
    );

    const root = container.firstElementChild;
    const main = screen.getByRole("main");
    const child = screen.getByText("SSR visible child");

    expect(root).toHaveAttribute("data-site-motion-root");
    expect(root).toHaveAttribute("data-reduced-motion-safe");
    expect(main).toHaveAttribute("data-ssr-visible");
    expect(main).toHaveAttribute("data-motion-hydration-safe");
    expect(child).toBeVisible();

    for (const element of [root, main, child]) {
      expect(element?.className ?? "").not.toMatch(/\b(opacity-0|invisible|hidden)\b/);
    }
  });

  it("rendersWidePublicCanvasInsteadOfNarrowShell", () => {
    render(
      <SiteShell channels={[]}>
        <p>wide shell child</p>
      </SiteShell>,
    );

    const main = screen.getByRole("main");

    expect(main).toHaveAttribute("data-public-layout-shell", "wide");
    expect(main).toHaveClass("max-w-7xl", "lg:px-10");
    expect(main.className).not.toContain("max-w-3xl");
  });
});
