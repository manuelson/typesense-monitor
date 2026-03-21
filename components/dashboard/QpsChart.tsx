"use client"

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts"
import { ChartCard } from "@/components/dashboard/ChartCard"
import type { TimePoint } from "@/lib/types"

function mergeSeries(search: TimePoint[], write: TimePoint[]) {
  const map = new Map<number, { t: number; search: number; write: number }>()
  for (const p of search) map.set(p.t, { t: p.t, search: p.v, write: 0 })
  for (const p of write) {
    const ex = map.get(p.t)
    if (ex) ex.write = p.v
    else map.set(p.t, { t: p.t, search: 0, write: p.v })
  }
  return Array.from(map.values()).sort((a, b) => a.t - b.t)
}

function QpsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 shadow-2xl min-w-[120px]">
      <p className="text-[10px] text-zinc-500 mb-1.5 tabular-nums">{new Date(label).toLocaleTimeString()}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: p.color }}>
            {(p.value as number)?.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface QpsChartProps { searchData: TimePoint[]; writeData: TimePoint[]; height?: number; stretch?: boolean; collapsible?: boolean }

export function QpsChart({ searchData, writeData, height = 220, stretch, collapsible }: QpsChartProps) {
  const data = mergeSeries(searchData, writeData)
  const lastSearch = searchData[searchData.length - 1]?.v
  const badge = lastSearch !== undefined && (
    <span className="text-[10px] tabular-nums text-purple-400 font-medium">{lastSearch.toFixed(1)} rps</span>
  )

  return (
    <ChartCard title="Requests / Second" right={badge} height={height} stretch={stretch} collapsible={collapsible}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 6, left: -8 }}>
        <defs>
          <linearGradient id="searchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#a855f7" stopOpacity={0.5}  />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0}    />
          </linearGradient>
          <linearGradient id="writeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ec4899" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#ec4899" stopOpacity={0}    />
          </linearGradient>
          <filter id="qpsGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="1 4" />
        <XAxis
          dataKey="t"
          tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "ui-monospace" }}
          tickLine={false} axisLine={false} minTickGap={60}
        />
        <YAxis
          tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "ui-monospace" }}
          tickLine={false} axisLine={false} width={26}
        />
        <Tooltip content={<QpsTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "3 3" }} />
        <Legend
          wrapperStyle={{ fontSize: 9, color: "#52525b", paddingTop: 4, fontFamily: "ui-monospace" }}
          iconType="circle" iconSize={6}
        />
        <Area
          type="monotone" dataKey="search" name="Search"
          stroke="#a855f7" strokeWidth={2} fill="url(#searchGrad)"
          dot={false} activeDot={{ r: 4, fill: "#a855f7", stroke: "#09090b", strokeWidth: 2 }}
          filter="url(#qpsGlow)" animationDuration={600}
        />
        <Area
          type="monotone" dataKey="write" name="Write"
          stroke="#ec4899" strokeWidth={2} fill="url(#writeGrad)"
          dot={false} activeDot={{ r: 4, fill: "#ec4899", stroke: "#09090b", strokeWidth: 2 }}
          animationDuration={600}
        />
      </AreaChart>
    </ChartCard>
  )
}
