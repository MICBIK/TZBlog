import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSiteStats: vi.fn(),
}));

vi.mock("@/lib/services/stats", () => ({
  getSiteStats: mocks.getSiteStats,
}));

const modulePath = "./HomeStats";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSiteStats.mockResolvedValue({
    views: 320,
    viewsInLast7Days: 84,
    posts: 12,
    comments: 5,
    lastShippedAt: new Date("2026-05-21T00:00:00Z"),
  });
});

describe("<HomeStats />", () => {
  it("renders mono single-line stats above footer", async () => {
    const { container } = render(await homeStats());

    expect(mocks.getSiteStats).toHaveBeenCalledTimes(1);

    const stats = screen.getByText(
      "v0.x · 12 posts · 84 views in 7 days · last shipped May 2026",
    );
    expect(stats).toHaveClass(
      "font-mono",
      "text-[length:var(--text-mono-sm)]",
      "text-muted-fg",
    );
    expect(container.querySelector("[data-home-stats]")).toBeInTheDocument();
    expect(container.querySelector(".grid")).not.toBeInTheDocument();
  });
});

async function homeStats() {
  const { HomeStats } = (await vi.importActual(modulePath)) as {
    HomeStats: () => Promise<ReactNode>;
  };
  return HomeStats();
}
