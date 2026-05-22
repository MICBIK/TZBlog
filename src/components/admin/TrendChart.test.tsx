import { render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { describe, expect, it } from "vitest"

interface TrendChartProps {
  data: Array<{ date: string; count: number }>
  height?: number
}

async function loadTrendChart(): Promise<{
  TrendChart: (props: TrendChartProps) => ReactElement
}> {
  const modulePath = "./TrendChart"
  return (await import(modulePath)) as {
    TrendChart: (props: TrendChartProps) => ReactElement
  }
}

describe("<TrendChart />", () => {
  it("TrendChart renders SVG polyline + empty fallback", async () => {
    const { TrendChart } = await loadTrendChart()

    const { container, rerender } = render(
      <TrendChart
        data={[
          { date: "2026-05-15", count: 10 },
          { date: "2026-05-16", count: 20 },
          { date: "2026-05-17", count: 15 },
        ]}
      />,
    )

    const svg = container.querySelector("svg")
    const polyline = container.querySelector("svg polyline")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("role", "img")
    expect(svg).toHaveAttribute("aria-label", "Trend chart over 3 days")
    expect(polyline).toBeInTheDocument()
    expect(polyline).toHaveAttribute("stroke", "currentColor")

    rerender(<TrendChart data={[]} />)
    expect(screen.getByText("No trend data")).toBeInTheDocument()
  })
})
