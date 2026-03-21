"use client"

import { useState } from "react"
import { CollapsibleCard } from "@/components/dashboard/CollapsibleCard"
import { cn } from "@/lib/utils"
import type { StatsResponse } from "@/lib/types"

type SortKey = "endpoint" | "rps" | "latency"
type SortDir = "asc" | "desc"

function latencyColor(ms: number): string {
  if (ms > 500) return "text-red-400"
  if (ms > 100) return "text-amber-400"
  return "text-zinc-300"
}

function barColor(ms: number): string {
  if (ms > 500) return "bg-red-500"
  if (ms > 100) return "bg-amber-500"
  return "bg-green-500"
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-zinc-700 ml-1 select-none">⇅</span>
  return <span className="text-green-500 ml-1 select-none">{dir === "asc" ? "↑" : "↓"}</span>
}

interface EndpointTableProps { stats: StatsResponse | undefined }

export function EndpointTable({ stats }: EndpointTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("latency")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const latencyMap = stats?.latency_ms ?? {}
  const rpsMap     = stats?.requests_per_second ?? {}

  const endpoints = Object.keys(latencyMap)
  if (endpoints.length === 0) return null

  const rows = endpoints.map((ep) => ({
    endpoint: ep,
    latency: latencyMap[ep] ?? 0,
    rps: rpsMap[ep] ?? 0,
  }))

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  const sorted = [...rows].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortKey === "endpoint") return a.endpoint.localeCompare(b.endpoint) * dir
    if (sortKey === "rps") return (a.rps - b.rps) * dir
    return (a.latency - b.latency) * dir
  })

  const maxLatency = Math.max(...rows.map((r) => r.latency), 1)

  const badge = (
    <span className="text-[9px] text-zinc-600 tabular-nums">{endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}</span>
  )

  function Th({ label, k, className }: { label: string; k: SortKey; className?: string }) {
    return (
      <th
        onClick={() => toggleSort(k)}
        className={cn(
          "text-[9px] uppercase tracking-widest text-zinc-600 font-normal h-7 cursor-pointer hover:text-zinc-400 transition-colors",
          className,
        )}
      >
        {label}
        <SortIcon active={sortKey === k} dir={sortDir} />
      </th>
    )
  }

  return (
    <CollapsibleCard title="Per-Endpoint Latency" right={badge} defaultOpen={false}>
      <div className="px-4 pb-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="border-b border-zinc-800/60">
              <Th label="Endpoint" k="endpoint" className="text-left pr-4" />
              <Th label="Req/s"    k="rps"      className="text-right pr-4" />
              <Th label="Avg Latency" k="latency" className="text-right pr-4" />
              <th className="text-[9px] uppercase tracking-widest text-zinc-600 font-normal h-7 w-32" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.endpoint}
                className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
              >
                <td className="py-2 pr-4 font-mono text-[10px] text-zinc-400 whitespace-nowrap">{row.endpoint}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-[11px] text-zinc-500">
                  {row.rps > 0 ? row.rps.toFixed(2) : "—"}
                </td>
                <td className={cn("py-2 pr-4 text-right tabular-nums text-[11px] font-medium", latencyColor(row.latency))}>
                  {row.latency.toFixed(1)} ms
                </td>
                <td className="py-2">
                  <div className="h-1 bg-zinc-800 w-32 overflow-hidden rounded-full">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", barColor(row.latency))}
                      style={{ width: `${(row.latency / maxLatency) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  )
}
