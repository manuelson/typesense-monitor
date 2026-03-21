"use client"

import { CollapsibleCard } from "@/components/dashboard/CollapsibleCard"
import { cn } from "@/lib/utils"
import type { LogEntry } from "@/lib/types"
import { useSettingsStore, AMBER_CLASSES, RED_CLASSES } from "@/store/settingsStore"

const EP_COLOR: Record<string, string> = {
  "/api/health":      "text-green-400",
  "/api/stats":       "text-purple-400",
  "/api/metrics":     "text-blue-400",
  "/api/collections": "text-amber-400",
  "/api/debug":       "text-pink-400",
}

const EP_SHORT: Record<string, string> = {
  "/api/health":      "/health      ",
  "/api/stats":       "/stats.json  ",
  "/api/metrics":     "/metrics.json",
  "/api/collections": "/collections ",
  "/api/debug":       "/debug       ",
}

interface ConsoleLogProps { entries: LogEntry[] }

export function ConsoleLog({ entries }: ConsoleLogProps) {
  const colors   = useSettingsStore((s) => s.colors)
  const amberCls = AMBER_CLASSES[colors.amber]
  const redCls   = RED_CLASSES[colors.red]

  const statusColor = (status: number, error?: string) => {
    if (error || status === 0 || status >= 500) return redCls.latText
    if (status >= 400) return amberCls.latText
    return "text-green-500"
  }
  const latencyColor = (ms: number) => {
    if (ms > 500) return redCls.latText
    if (ms > 100) return amberCls.latText
    return "text-zinc-600"
  }
  const totalBadge = (
    <span className="text-[9px] text-zinc-600 tabular-nums">{entries.length} entries</span>
  )

  return (
    <CollapsibleCard title="Request Log" right={totalBadge} contentClass="bg-zinc-950">
      {/* Terminal chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-zinc-800/60">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        <span className="ml-2 text-[9px] text-zinc-400 tracking-widest">TERMINAL</span>
      </div>
      <div className="h-52 overflow-y-auto font-mono text-[10px] leading-[1.6] px-4 pb-3">
        {entries.length === 0 && <span className="text-zinc-400">_ awaiting requests...</span>}
        {entries.map((e) => {
          const epColor = EP_COLOR[e.endpoint] ?? "text-zinc-400"
          const short = EP_SHORT[e.endpoint] ?? e.endpoint
          const sColor = statusColor(e.status, e.error)
          const lColor = latencyColor(e.latencyMs)
          const time = e.ts.toLocaleTimeString("en-GB", { hour12: false })
          return (
            <div key={e.id} className="flex gap-2 whitespace-nowrap hover:bg-zinc-800/20 rounded px-1 -mx-1">
              <span className="text-zinc-400 tabular-nums shrink-0">{time}</span>
              <span className="text-zinc-600 shrink-0">GET</span>
              <span className={cn("shrink-0", epColor)}>{short}</span>
              <span className={cn("tabular-nums shrink-0 w-7 text-right", sColor)}>
                {e.error ? "ERR" : e.status}
              </span>
              <span className={cn("tabular-nums shrink-0", lColor)}>{e.latencyMs}ms</span>
              {e.error && <span className="text-red-500/60 truncate">{e.error}</span>}
            </div>
          )
        })}
      </div>
    </CollapsibleCard>
  )
}
