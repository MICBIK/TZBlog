import { render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import AdminDashboardPage from "./page"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getBrowserDistribution: vi.fn(),
  getDeviceDistribution: vi.fn(),
  getTopPaths: vi.fn(),
  getTopReferrers: vi.fn(),
  getViewSummary: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: mocks.auth,
}))

vi.mock("@/lib/services/analytics", () => ({
  getBrowserDistribution: mocks.getBrowserDistribution,
  getDeviceDistribution: mocks.getDeviceDistribution,
  getTopPaths: mocks.getTopPaths,
  getTopReferrers: mocks.getTopReferrers,
  getViewSummary: mocks.getViewSummary,
}))

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type DashboardPage = (props: PageProps) => Promise<ReactElement>

async function renderDashboard(
  searchParams: Record<string, string | string[] | undefined> = {},
): Promise<void> {
  const page = await (AdminDashboardPage as unknown as DashboardPage)({
    searchParams: Promise.resolve(searchParams),
  })
  render(page)
}

function setupSuccessfulMocks(): void {
  mocks.auth.mockResolvedValue({
    user: { email: "admin@example.com" },
  })
  mocks.getViewSummary.mockImplementation(async (range: string) => ({
    total: range === "today" ? 3 : range === "30d" ? 30 : 7,
    unique: 2,
    perDay: [
      { date: "2026-05-20", count: 2 },
      { date: "2026-05-21", count: 5 },
    ],
  }))
  mocks.getTopPaths.mockResolvedValue([
    { path: "/posts/a", count: 10 },
    { path: "/about", count: 4 },
  ])
  mocks.getTopReferrers.mockResolvedValue([
    { referrer: "https://google.com", count: 8 },
  ])
  mocks.getDeviceDistribution.mockResolvedValue([
    { device: "desktop", count: 6 },
    { device: "mobile", count: 3 },
  ])
  mocks.getBrowserDistribution.mockResolvedValue([
    { browser: "Chrome", count: 5 },
  ])
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "warn").mockImplementation(() => undefined)
  setupSuccessfulMocks()
})

describe("<AdminDashboardPage />", () => {
  it("AdminDashboardPage renders all 7 widgets", async () => {
    await renderDashboard()

    expect(screen.getAllByTestId("metric-card")).toHaveLength(3)
    expect(screen.getByText("Top Paths")).toBeInTheDocument()
    expect(screen.getByText("Top Referrers")).toBeInTheDocument()
    expect(screen.getByText("Devices")).toBeInTheDocument()
    expect(screen.getByText("Browsers")).toBeInTheDocument()
    expect(screen.getByTestId("trend-chart")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "7d" })).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  it("AdminDashboardPage reads range from searchParams with default", async () => {
    await renderDashboard({ range: "30d" })

    expect(mocks.getViewSummary).toHaveBeenCalledWith("30d")
    expect(mocks.getTopPaths).toHaveBeenCalledWith("30d", 10)
    expect(mocks.getTopReferrers).toHaveBeenCalledWith("30d", 10)
    expect(mocks.getDeviceDistribution).toHaveBeenCalledWith("30d")
    expect(mocks.getBrowserDistribution).toHaveBeenCalledWith("30d")

    vi.clearAllMocks()
    setupSuccessfulMocks()
    await renderDashboard({ range: "invalid" })

    expect(mocks.getTopPaths).toHaveBeenCalledWith("7d", 10)
    expect(mocks.getTopReferrers).toHaveBeenCalledWith("7d", 10)
    expect(mocks.getDeviceDistribution).toHaveBeenCalledWith("7d")
    expect(mocks.getBrowserDistribution).toHaveBeenCalledWith("7d")
  })

  it("RangeSelector renders 4 options + active state", async () => {
    await renderDashboard({ range: "all" })

    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute(
      "href",
      expect.stringContaining("range=today"),
    )
    expect(screen.getByRole("link", { name: "7d" })).toHaveAttribute(
      "href",
      expect.stringContaining("range=7d"),
    )
    expect(screen.getByRole("link", { name: "30d" })).toHaveAttribute(
      "href",
      expect.stringContaining("range=30d"),
    )
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  it("widget failure shows fallback while others render", async () => {
    mocks.getTopPaths.mockRejectedValueOnce(new Error("DB"))

    await renderDashboard()

    expect(screen.getByText("Failed to load Top Paths")).toBeInTheDocument()
    expect(screen.getAllByTestId("metric-card")).toHaveLength(3)
    expect(screen.getByText("Top Referrers")).toBeInTheDocument()
  })
})
