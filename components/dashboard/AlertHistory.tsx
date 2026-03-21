"use client"

import { X, Trash2 } from "lucide-react"
import { useAlertHistoryStore } from "@/store/alertHistoryStore"
import { CollapsibleCard } from "@/components/dashboard/CollapsibleCard"
import { cn } from "@/lib/utils"

function levelClasses(level: string): string {
  if (level === "red")   return "text-red-400 border-red-500/20 bg-red-500/5"
  if (level === "amber") return "text-amber-400 border-amber-500/20 bg-amber-500/5"
  return "text-green-400 border-green-500/20 bg-green-500/5"
}

function badgeClasses(level: string): string {
  if (level === "red")   return "text-red-300 border-red-500/40 bg-red-500/10"
  if (level === "amber") return "text-amber-300 border-amber-500/40 bg-amber-500/10"
  return "text-green-300 border-green-500/40 bg-green-500/10"
}

export function AlertHistory() {
  const { entries, remove, clear } = useAlertHistoryStore()
  const sorted = [...entries].reverse() // newest first

  const badge = (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-zinc-600 tabular-nums">{entries.length} entries</span>
      {entries.length > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); clear() }}
          className="flex items-center gap-1 text-[9px] text-zinc-700 hover:text-red-500 transition-colors"
          title="Clear all"
        >
          <Trash2 size={10} />
          Clear all
        </button>
      )}
    </div>
  )

  return (
    <CollapsibleCard title="Alert History" right={badge} collapsible={false}>
      <div className="px-4 pb-4 max-h-64 overflow-y-auto space-y-1 scrollbar-none">
        {sorted.length === 0 ? (
          <p className="flex items-center justify-center text-zinc-700 text-[11px] py-6">No alerts recorded</p>
        ) : (
          sorted.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-3 px-2.5 py-1.5 border text-[10px] rounded-sm group",
                levelClasses(entry.level),
              )}
            >
              <span className="text-zinc-700 tabular-nums shrink-0 font-mono text-[9px]">
                {new Date(entry.ts).toLocaleTimeString()}
              </span>
              <span className={cn(
                "text-[8px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm font-bold shrink-0",
                badgeClasses(entry.level),
              )}>
                {entry.level}
              </span>
              <span className="truncate flex-1">{entry.message}</span>
              <button
                onClick={() => remove(entry.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400"
                title="Delete"
              >
                <X size={11} />
              </button>
            </div>
          ))
        )}
      </div>
    </CollapsibleCard>
  )
}
