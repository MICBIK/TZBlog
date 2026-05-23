import { render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { describe, expect, it } from "vitest"

interface DistributionBarProps {
  title: string
  items: Array<{ label: string; count: number }>
}

async function loadDistributionBar(): Promise<{
  DistributionBar: (props: DistributionBarProps) => ReactElement
}> {
  const modulePath = "./DistributionBar"
  return (await import(modulePath)) as {
    DistributionBar: (props: DistributionBarProps) => ReactElement
  }
}

describe("<DistributionBar />", () => {
  it("DistributionBar renders proportional bars", async () => {
    const { DistributionBar } = await loadDistributionBar()

    const { container, rerender } = render(
      <DistributionBar
        title="Devices"
        items={[
          { label: "desktop", count: 80 },
          { label: "mobile", count: 20 },
        ]}
      />,
    )

    expect(screen.getByText("Devices")).toBeInTheDocument()
    expect(screen.getByText("desktop")).toBeInTheDocument()
    expect(screen.getByText("80")).toBeInTheDocument()
    expect(screen.getByText("mobile")).toBeInTheDocument()
    expect(screen.getByText("20")).toBeInTheDocument()

    const bars = container.querySelectorAll("[data-testid='bar']")
    expect(bars[0]).toHaveStyle({ width: "100%" })
    expect(bars[1]).toHaveStyle({ width: "25%" })

    rerender(<DistributionBar title="Devices" items={[]} />)
    expect(screen.getByText("暂无数据")).toBeInTheDocument()
  })
})
