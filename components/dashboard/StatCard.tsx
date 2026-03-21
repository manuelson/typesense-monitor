import { cn } from "@/lib/utils"
import type { AlertLevel } from "@/lib/types"

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  sublabel?: string
  level?: AlertLevel
  size?: "md" | "sm"
}

export function StatCard({ label, value, unit, sublabel, level, size = "md" }: StatCardProps) {
  const levelColor = {
    green: "text-green-400",
    amber: "text-amber-400",
    red: "text-red-400",
  }[level ?? "green"]

  const borderColor = {
    green: "border-l-green-800",
    amber: "border-l-amber-700",
    red: "border-l-red-700",
  }[level ?? "green"]

  return (
    <div className={cn(
      "bg-zinc-900 border border-zinc-800 border-l-2 rounded",
      size === "sm" ? "px-2.5 py-1.5" : "px-3 py-2",
      borderColor,
    )}>
      <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">{label}</p>
      <p className={cn(
        "font-bold tabular-nums leading-none",
        size === "sm" ? "text-base" : "text-xl",
        levelColor,
      )}>
        {value}
        {unit && <span className="text-xs font-normal text-zinc-600 ml-0.5">{unit}</span>}
      </p>
      {sublabel && <p className="text-[9px] text-zinc-700 mt-0.5 truncate">{sublabel}</p>}
    </div>
  )
}
