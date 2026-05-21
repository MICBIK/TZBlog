import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import SiteLayout from "./layout"

vi.mock("@/components/site/SiteHeader", () => ({
  SiteHeader: () => <div data-testid="site-header" />,
}))
vi.mock("@/components/site/SiteFooter", () => ({
  SiteFooter: () => <div data-testid="site-footer" />,
}))
vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}))
vi.mock("@/components/site/AnalyticsBeacon", () => ({
  AnalyticsBeacon: () => <div data-testid="analytics-beacon" />,
}))

describe("<SiteLayout /> SPEC-A-L-1", () => {
  it("renders <AnalyticsBeacon /> alongside header/footer/toaster + children", () => {
    render(
      <SiteLayout>
        <p>child</p>
      </SiteLayout>,
    )
    expect(screen.getByTestId("analytics-beacon")).toBeInTheDocument()
    expect(screen.getByTestId("site-header")).toBeInTheDocument()
    expect(screen.getByTestId("site-footer")).toBeInTheDocument()
    expect(screen.getByTestId("toaster")).toBeInTheDocument()
    expect(screen.getByText("child")).toBeInTheDocument()
  })
})
