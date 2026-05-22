import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface DistributionBarItem {
  label: string
  count: number
}

export interface DistributionBarProps {
  title: string
  items: DistributionBarItem[]
}

export function DistributionBar({ title, items }: DistributionBarProps) {
  const maxCount = Math.max(...items.map((item) => item.count), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-fg">No data</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const width = maxCount === 0 ? 0 : (item.count / maxCount) * 100
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-fg">
                      {item.label}
                    </span>
                    <span className="font-medium tabular-nums text-fg">
                      {new Intl.NumberFormat("en-US").format(item.count)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      data-testid="bar"
                      className="h-full rounded-full bg-primary"
                      style={{ width: formatWidth(width) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatWidth(width: number): string {
  const rounded = Number(width.toFixed(2))
  return `${rounded}%`
}
