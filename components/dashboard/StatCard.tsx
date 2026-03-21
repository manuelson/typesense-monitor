"use client"

import { cn } from "@/lib/utils"
import type { AlertLevel } from "@/lib/types"
import { useSettingsStore, AMBER_CLASSES, RED_CLASSES } from "@/store/settingsStore"

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  sublabel?: string
  level?: AlertLevel
  size?: "md" | "sm"
}

export function StatCard({ label, value, unit, sublabel, level, size = "md" }: StatCardProps) {
  const colors   = useSettingsStore((s) => s.colors)
  const amberCls = AMBER_CLASSES[colors.amber]
  const redCls   = RED_CLASSES[colors.red]

  const levelColor  = level === "red" ? redCls.text  : level === "amber" ? amberCls.text  : "text-green-400"
  const borderColor = level === "red" ? redCls.borderAccent : level === "amber" ? amberCls.borderAccent : "border-l-green-800"

  return (
    <div className={cn(
      "bg-zinc-900 border border-zinc-800 border-l-2 rounded",
      size === "sm" ? "px-2.5 py-1.5" : "px-3 py-2",
      borderColor,
    )}>
      <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">{label}</p>
      <p className={cn(
        "font-bold tabular-nums leading-none",
        size === "sm" ? "text-base" : "text-xl",
        levelColor,
      )}>
        {value}
        {unit && <span className="text-xs font-normal text-zinc-400 ml-0.5">{unit}</span>}
      </p>
      {sublabel && <p className="text-[9px] text-zinc-400 mt-0.5 truncate">{sublabel}</p>}
    </div>
  )
}
