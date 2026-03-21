"use client"

import { cn } from "@/lib/utils"
import type { AlertLevel } from "@/lib/types"
import { useSettingsStore, AMBER_CLASSES, RED_CLASSES } from "@/store/settingsStore"

export function Tile({
  label, value, unit, sub, level = "green", hint, source, large = false,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  level?: AlertLevel
  hint?: string
  source?: string
  large?: boolean
}) {
  const colors = useSettingsStore((s) => s.colors)
  const amberCls = AMBER_CLASSES[colors.amber]
  const redCls   = RED_CLASSES[colors.red]

  const bar = level === "red" ? redCls.dot : level === "amber" ? amberCls.dot : "bg-zinc-700"
  const val = level === "red" ? redCls.text : level === "amber" ? amberCls.text : "text-zinc-100"

  return (
    <div className="relative group/tile bg-zinc-900 border border-zinc-800 flex flex-col p-3 gap-1 overflow-visible">
      {/* top accent bar */}
      <div className={cn("absolute top-0 inset-x-0 h-[2px]", bar)} />

      {/* value */}
      <p className={cn("tabular-nums font-bold leading-none", large ? "text-3xl" : "text-lg", val)}>
        {value}
        {unit && <span className="text-[11px] font-normal text-zinc-600 ml-1">{unit}</span>}
      </p>

      {/* label + tooltip trigger */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 truncate">{label}</span>
        {hint && (
          <span className="relative shrink-0 cursor-default">
            <span className="text-[9px] text-zinc-400 group-hover/tile:text-zinc-500 transition-colors select-none leading-none">ⓘ</span>
            <span className="
              absolute bottom-full left-0 mb-2 w-56 z-50 pointer-events-none
              bg-zinc-800 border border-zinc-700/60 shadow-2xl px-2.5 py-2
              text-[10px] leading-snug text-zinc-300 font-normal normal-case tracking-normal
              opacity-0 group-hover/tile:opacity-100 transition-opacity duration-150
            ">
              {hint}
              {source && (
                <span className="block mt-1.5 pt-1.5 border-t border-zinc-700/50 text-[9px] text-zinc-500 font-mono break-all">
                  {source}
                </span>
              )}
            </span>
          </span>
        )}
      </div>

      {/* sublabel */}
      {sub && <p className="text-[9px] text-zinc-400 truncate">{sub}</p>}
    </div>
  )
}
