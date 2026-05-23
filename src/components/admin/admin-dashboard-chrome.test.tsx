import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DistributionBar } from "./DistributionBar"
import { TopList } from "./TopList"
import { TrendChart } from "./TrendChart"

describe("admin dashboard chrome", () => {
  it("rendersChineseAnalyticsEmptyStates", () => {
    const { rerender } = render(<TrendChart data={[]} />)

    expect(screen.getByText("暂无趋势数据")).toBeInTheDocument()
    expect(screen.queryByText("No trend data")).not.toBeInTheDocument()

    rerender(<TopList title="热门页面" items={[]} />)
    expect(screen.getByText("暂无数据")).toBeInTheDocument()
    expect(screen.queryByText("No data")).not.toBeInTheDocument()

    rerender(<DistributionBar title="设备分布" items={[]} />)
    expect(screen.getByText("暂无数据")).toBeInTheDocument()
    expect(screen.queryByText("No data")).not.toBeInTheDocument()
  })

  it("usesChineseTrendChartAccessibleLabel", () => {
    render(
      <TrendChart
        data={[
          { date: "2026-05-22", count: 2 },
          { date: "2026-05-23", count: 4 },
        ]}
      />,
    )

    const chart = screen.getByRole("img", { name: "最近 2 天趋势图" })
    expect(chart).toBeInTheDocument()
    expect(chart.querySelector("title")).toHaveTextContent("最近 2 天趋势图")
  })
})
