import { CollapsibleCard } from "@/components/dashboard/CollapsibleCard"
import { ResponsiveContainer } from "recharts"

interface ChartCardProps {
  title: string
  right?: React.ReactNode
  height?: number
  stretch?: boolean
  collapsible?: boolean
  children: React.ReactNode
  defaultOpen?: boolean
}

export function ChartCard({ title, right, height = 220, stretch, collapsible = true, children, defaultOpen = true }: ChartCardProps) {
  return (
    <CollapsibleCard
      title={title} right={right} defaultOpen={defaultOpen} collapsible={collapsible}
      stretch={stretch}
      className={stretch ? "h-full" : undefined}
      contentClass={stretch ? "flex flex-col" : undefined}
    >
      <div
        className={stretch ? "flex-1 min-h-0 px-1 pt-1" : "px-1 pt-1"}
        style={stretch ? undefined : { height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </CollapsibleCard>
  )
}
