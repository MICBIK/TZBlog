import { render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { describe, expect, it } from "vitest"

interface MetricCardProps {
  label: string
  value: number
  delta?: number
}

async function loadMetricCard(): Promise<{
  MetricCard: (props: MetricCardProps) => ReactElement
}> {
  const modulePath = "./MetricCard"
  return (await import(modulePath)) as {
    MetricCard: (props: MetricCardProps) => ReactElement
  }
}

describe("<MetricCard />", () => {
  it("MetricCard renders label + formatted number + optional delta", async () => {
    const { MetricCard } = await loadMetricCard()

    const { rerender } = render(
      <MetricCard label="Views (7d)" value={1234} delta={12} />,
    )

    expect(screen.getByTestId("metric-card")).toBeInTheDocument()
    expect(screen.getByText("Views (7d)")).toBeInTheDocument()
    expect(screen.getByText("1,234")).toBeInTheDocument()
    expect(screen.getByText("+12%")).toBeInTheDocument()

    rerender(<MetricCard label="Views (7d)" value={1234} />)
    expect(screen.queryByText("+12%")).not.toBeInTheDocument()
  })
})
