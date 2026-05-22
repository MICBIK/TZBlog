import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface MetricCardProps {
  label: string
  value: number
  delta?: number
}

export function MetricCard({ label, value, delta }: MetricCardProps) {
  const formattedValue = new Intl.NumberFormat("en-US").format(value)
  const deltaLabel =
    delta === undefined ? null : `${delta >= 0 ? "+" : ""}${delta}%`

  return (
    <Card data-testid="metric-card">
      <CardHeader className="space-y-2 pb-2">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-fg">
          {label}
        </p>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-fg">
          {formattedValue}
        </p>
        {delta !== undefined && deltaLabel ? (
          <span
            className={cn(
              "text-sm font-medium",
              delta >= 0 ? "text-primary" : "text-destructive",
            )}
          >
            {deltaLabel}
          </span>
        ) : null}
      </CardContent>
    </Card>
  )
}
