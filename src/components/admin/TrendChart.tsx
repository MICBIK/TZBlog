export interface TrendChartPoint {
  date: string
  count: number
}

export interface TrendChartProps {
  data: TrendChartPoint[]
  height?: number
}

const WIDTH = 600

export function TrendChart({ data, height = 96 }: TrendChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-fg">暂无趋势数据</p>
  }

  const maxCount = Math.max(...data.map((point) => point.count), 1)
  const stepX = data.length > 1 ? WIDTH / (data.length - 1) : 0
  const chartLabel = `最近 ${data.length} 天趋势图`
  const points = data
    .map((point, index) => {
      const x = data.length > 1 ? index * stepX : WIDTH / 2
      const y = height - (point.count / maxCount) * height
      return `${round(x)},${round(y)}`
    })
    .join(" ")

  return (
    <svg
      role="img"
      aria-label={chartLabel}
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="h-24 w-full text-primary"
      preserveAspectRatio="none"
      data-testid="trend-chart"
    >
      <title>{chartLabel}</title>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function round(value: number): number {
  return Number(value.toFixed(2))
}
