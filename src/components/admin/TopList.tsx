import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface TopListItem {
  label: string
  count: number
}

export interface TopListProps {
  title: string
  items: TopListItem[]
}

export function TopList({ title, items }: TopListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-fg">暂无数据</p>
        ) : (
          <ol data-testid="top-list" className="space-y-3">
            {items.map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 text-sm"
              >
                <span className="text-muted-fg">{index + 1}</span>
                <span className="min-w-0 truncate text-fg">{item.label}</span>
                <span className="font-medium tabular-nums text-fg">
                  {new Intl.NumberFormat("en-US").format(item.count)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
