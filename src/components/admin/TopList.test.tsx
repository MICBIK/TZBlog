import { render, screen, within } from "@testing-library/react"
import type { ReactElement } from "react"
import { describe, expect, it } from "vitest"

interface TopListProps {
  title: string
  items: Array<{ label: string; count: number }>
}

async function loadTopList(): Promise<{
  TopList: (props: TopListProps) => ReactElement
}> {
  const modulePath = "./TopList"
  return (await import(modulePath)) as {
    TopList: (props: TopListProps) => ReactElement
  }
}

describe("<TopList />", () => {
  it("TopList renders ranked items + empty state", async () => {
    const { TopList } = await loadTopList()

    const { rerender } = render(
      <TopList
        title="Top Paths"
        items={[
          { label: "/a", count: 10 },
          { label: "/b", count: 5 },
        ]}
      />,
    )

    expect(screen.getByText("Top Paths")).toBeInTheDocument()
    const list = screen.getByTestId("top-list")
    expect(within(list).getByText("1")).toBeInTheDocument()
    expect(within(list).getByText("/a")).toBeInTheDocument()
    expect(within(list).getByText("10")).toBeInTheDocument()
    expect(within(list).getByText("2")).toBeInTheDocument()
    expect(within(list).getByText("/b")).toBeInTheDocument()
    expect(within(list).getByText("5")).toBeInTheDocument()

    rerender(<TopList title="Top Paths" items={[]} />)
    expect(screen.getByText("No data")).toBeInTheDocument()
  })
})
